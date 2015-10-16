import MonitUrl = require('./MonitUrl');

class MonitSystemStatus {
	public uptime: number;
	public monitUrl: MonitUrl;
	public memoryPercent: number;
	public cpuLoad: number;

	public constructor(monitSrc: any)  {
		try {
			this.uptime = monitSrc.server.uptime;
			this.monitUrl = monitSrc.server.httpd.address + monitSrc.server.httpd.port;
			
			var service = monitSrc.service.filter((value, index, array) => value.$.type == '5')[0];
			this.memoryPercent = service.memory.percent;
			this.cpuLoad = service.cpu.user + service.cpu.system;
		} catch (error) {
			console.log(error);
		}
	}
}

export = MonitSystemStatus;