class MonitProcessStatus {
	public uptime: number;
	public memoryPercent: number;
	public cpuPercent: number;
	
	public constructor(serviceSrc: any) {
		try {
			this.uptime = serviceSrc.uptime;
			this.memoryPercent = serviceSrc.memory.percent;
			this.cpuPercent = serviceSrc.cpu.percent;
		} catch (error) {
			console.log(error);
		}
		this.uptime = serviceSrc
	}
}

export = MonitProcessStatus;