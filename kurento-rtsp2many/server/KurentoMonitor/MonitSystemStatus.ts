import MonitUrl = require('./MonitUrl');

class MonitSystemStatus {
	public uptime: number;
	public memoryPercent: number;
	public cpuLoad: number;

	public constructor(monitSrc: any)  {
			var server = monitSrc.server[0];
			this.uptime = server.uptime[0];
			
			var service = monitSrc.service.filter((value, index, array) => value.$.type == '5')[0].system[0];
			this.memoryPercent = service.memory[0].percent[0];
			this.cpuLoad = service.cpu[0].user[0] + service.cpu[0].system[0];
	}
}

export = MonitSystemStatus;