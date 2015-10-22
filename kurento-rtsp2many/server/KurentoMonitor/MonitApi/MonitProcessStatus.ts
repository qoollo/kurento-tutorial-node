import MonitState = require("./MonitState");

class MonitProcessStatus {
	public uptime: number;
	public memoryPercent: number;
	public cpuLoad: number;
	public pid: number;
	public ppid: number;
	public children: number;
	public state: MonitState;
	
	public constructor(serviceSrc: any) {
		this.uptime = (serviceSrc.uptime == undefined) ? undefined :
			 parseInt(serviceSrc.uptime[0], 10);
		this.memoryPercent = (serviceSrc.memory == undefined) ? undefined :
			parseFloat(serviceSrc.memory[0].percent[0]);
		this.cpuLoad = (serviceSrc.cpu == undefined) ? undefined :
			parseFloat(serviceSrc.cpu[0].percent[0]);
		this.pid = (serviceSrc.pid == undefined) ? undefined :
			parseInt(serviceSrc.pid[0], 10);
		this.ppid = (serviceSrc.ppid == undefined) ? undefined :
			parseInt(serviceSrc.ppid[0], 10);
		this.children = (serviceSrc.children == undefined) ? undefined :
			parseInt(serviceSrc.children[0], 10);
	}
}

export = MonitProcessStatus;