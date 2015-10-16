import http = require('http');
import xml2js = require('xml2js');
import MonitUrl = require('./MonitUrl');
import MonitStatus = require('./MonitStatus');


class MonitApiClient {	
	getMonitStatus(url: MonitUrl): Promise<MonitStatus> {
		var options = {
			host: url.monitUrl.host,
			path: url.monitUrl.path
		};
		var monitStatus: MonitStatus;
		
		http.get(options, response => {
			var xmlSrc: string = '';
			
			response.on('data', chunk => {
				xmlSrc += chunk;
			});
			response.on('error', error => {
				return console.log(error);
			});
			response.on('end', () => 
			{
				var src = xml2js.parseString(xmlSrc, (err, result) => {
					if (err != null)
						return console.log(err);
					monitStatus = new MonitStatus(result.monit); 
				});
			});
		});
		
		return null;
	}
	
	
	
}

export = MonitApiClient;