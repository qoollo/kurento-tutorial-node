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
		this.uptime = parseInt(serviceSrc.uptime[0], 10);
		this.memoryPercent = parseFloat(serviceSrc.memory[0].percent[0]);
		this.cpuLoad = parseFloat(serviceSrc.cpu[0].percent[0]);
		this.pid = parseInt(serviceSrc.pid[0], 10);
		this.ppid = parseInt(serviceSrc.ppid[0], 10);
		this.children = parseInt(serviceSrc.children[0], 10);
	}
}

export = MonitProcessStatus;