class MonitProcessStatus {
	public uptime: number;
	public memoryPercent: number;
	public cpuPercent: number;
	
	public constructor(serviceSrc: any) {
		this.uptime = serviceSrc.uptime;
		this.memoryPercent = serviceSrc.memory.percent;
		this.cpuPercent = serviceSrc.cpu.percent;
		this.uptime = serviceSrc;
	}
}

export = MonitProcessStatus;