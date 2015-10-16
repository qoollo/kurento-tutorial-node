import http = require('http');
import xml2js = require('xml2js');
import MonitUrl = require('./MonitUrl');
import MonitStatus = require('./MonitStatus');
import Logger = require('../Logger');


class MonitApiClient {	
	getMonitStatus(url: MonitUrl): Promise<MonitStatus> {
		return new Promise<MonitStatus>((resolve, reject) => {
			try {
				var options = {
					host: url.monitUrl.host,
					path: url.monitUrl.path
				};
				var monitStatus: MonitStatus;
				
				var getResponse = http.get(options, response => {
					var xmlSrc: string = '';
					
					response.on('data', chunk => {
						xmlSrc += chunk;
					});
					response.on('error', error => {
						reject(error);
						Logger.error(error);
					});
					response.on('end', () => {
						var src = xml2js.parseString(xmlSrc, (error, result) => {
							if (error != null) {
								reject(error);
								Logger.error(error);
							}
							monitStatus = new MonitStatus(result.monit);
							resolve(monitStatus);
							Logger.debug('getMonitStatus resolved');
						});
					});
				});
				getResponse.on('error', error => {
					reject(error);
					Logger.error(error);
				});		
			} catch (error) {
				reject(error);
				Logger.error(error);
			}
		});
	}
}

export = MonitApiClient;