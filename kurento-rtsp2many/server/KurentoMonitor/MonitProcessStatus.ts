class MonitProcessStatus {
	public uptime: number;
	public memoryPercent: number;
	public cpuLoad: number;
	public pid: number;
	public ppid: number;
	public children: number;
	
	public constructor(serviceSrc: any) {
		this.uptime = serviceSrc.uptime[0];
		this.memoryPercent = serviceSrc.memory[0].percent[0];
		this.cpuLoad = serviceSrc.cpu[0].percent[0];
		this.pid = serviceSrc.pid[0];
		this.ppid = serviceSrc.ppid[0];
		this.children = serviceSrc.children[0];
	}
}

export = MonitProcessStatus;