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
						var res: MonitState[] = [];
						var kurentoInd: number = txtSrc.indexOf("Process 'kurento'\n  status");
						while (kurentoInd != -1) {
							res.push(MonitApiClient.parseState(txtSrc, kurentoInd));
							kurentoInd = txtSrc.indexOf("Process 'kurento'\n  status", kurentoInd + 1);	
						};	
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
	
	private static parseState(txtSrc: string, startNumber: number): MonitState {
		var statusInd = txtSrc.indexOf('status', startNumber);
		var charInd = statusInd + 6;
		while (txtSrc[charInd] == ' ')
			++charInd;
		var testString = txtSrc.substr(charInd, 20);
		if (testString.indexOf('Running') == 0)
			return MonitState.Running;
		else if (testString.indexOf('Not monitored') == 0)
			return MonitState.NotMonitoring;
		else if (testString.indexOf('Initializing') == 0)
			return MonitState.Initializing;
		else
			return MonitState.Unknown;
	}
}

export = MonitApiClient;