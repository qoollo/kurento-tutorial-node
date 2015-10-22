class MonitSystemStatus {
	public uptime: number;
	public memoryPercent: number;
	public cpuLoad: number;

	public constructor(monitSrc: any)  {
			var server = monitSrc.server[0];
			this.uptime = parseInt(server.uptime[0], 10);
			
			var service = monitSrc.service.filter((value, index, array) => value.$.type == '5')[0].system[0];
			this.memoryPercent = parseFloat(service.memory[0].percent[0]);
			this.cpuLoad = parseFloat(service.cpu[0].user[0]) + parseFloat(service.cpu[0].system[0]);
	}
}

export = MonitSystemStatus;