import http = require('http');
import xml2js = require('xml2js');
import MonitUrl = require('./MonitUrl');
import MonitStatus = require('./MonitStatus');
import Logger = require('../Logger');
import AppConfig = require('../AppConfig');
import MonitState = require('./MonitState');

class MonitApiClient {	
	getMonitStatus(url: MonitUrl): Promise<MonitStatus> {
		return new Promise<MonitStatus>((resolve, reject) => {
			try {				
				var promise = Promise.all([this.getXmlStatus(url), this.getTxtStatus(url)]);
				promise.then(valueArray => {
					for (var i in valueArray[0].processStatuses)
						valueArray[0].processStatuses[i].state = valueArray[1][i];
					Logger.debug('getMonitStatus resolved');
					resolve(valueArray[0]);
				});
				promise.catch(error => reject(error));
			} catch (error) {
				Logger.error(error);
				reject(error);
			}
		});
	}
	
	private getTxtStatus(url: MonitUrl): Promise<any> {
		return new Promise<MonitState[]>((resolve, reject) => {
			try {
				var options = {
					host: url.monitUrl.hostname,
					port: url.monitUrl.port,
					path: AppConfig.config.monit.txtPath,
					auth: AppConfig.config.monit.login + ':' + AppConfig.config.monit.password
				};
				
				var getResponse = http.get(options, response => {
					var txtSrc: string;
					response.on('data', chunk => {
						txtSrc += chunk;
					});
					response.on('error', error => {
						Logger.error(error);
						reject(error);
					});
					response.on('end', () => {
						var kurentoProcesses = txtSrc.match("Process 'kurento'(.|\s)*?(?=System|Process|$)");
						/*
						 все куски, начинающиеся на Process 'kurento', и заканчивающиеся на
						 Process, System или конец строки
						*/
						
						var res = kurentoProcesses.map((value, index, array) => MonitApiClient.parseState(value));
						Logger.debug('getTxtStatus resolved');
						resolve(res);
					});
				});
				getResponse.on('error', error => {
					Logger.error(error);
					reject(error);
				});
			} catch(error) {
				Logger.error(error);
				reject(error);
			};
		});
	}
	
	private getXmlStatus(url: MonitUrl): Promise<any> {
		return new Promise<MonitStatus>((resolve, reject) => {
			try {
				var options = {
					host: url.monitUrl.hostname,
					port: url.monitUrl.port,
					path: AppConfig.config.monit.xmlPath,
					auth: AppConfig.config.monit.login + ':' + AppConfig.config.monit.password
				};
				var monitStatus: MonitStatus;
				
				var getResponse = http.get(options, response => {
					var xmlSrc: string = '';
					
					response.on('data', chunk => {
						xmlSrc += chunk;
					});
					response.on('error', error => {
						Logger.error(error);
						reject(error);
					});
					response.on('end', () => {
						var src = xml2js.parseString(xmlSrc, (error, result) => {
							if (error != null) {
								Logger.error(error);
								reject(error);
							}
							monitStatus = new MonitStatus(result.monit);
							Logger.debug('getXmlStatus resolved');
							resolve(monitStatus);
						});
					});
				});
				getResponse.on('error', error => {
					Logger.error(error);
					reject(error);
				});		
			} catch (error) {
				Logger.error(error);
				reject(error);
			}
		});
	};
	
	private static parseState(processSrc: string): MonitState {
		var statusString = processSrc.match("\n\s*status\s.*");
		// ищем первую строку, в которой первое слово — status, и забираем её
		if (statusString.length == 0)
			return MonitState.Unknown;
		var index = statusString[0].indexOf('status');
		var dataString = statusString[0][index + 6];
		while (dataString[index] == ' ' || dataString[index] == '\t')
			++index;
		var info = dataString.substr(index);
		if (info.indexOf('Running') == 0)
			return MonitState.Running;
		else if (info.indexOf('Not monitored') == 0)
			return MonitState.NotMonitoring;
		else if (info.indexOf('Initializing') == 0)
			return MonitState.Initializing;
		else
			return MonitState.Unknown;
	}
}

export = MonitApiClient;