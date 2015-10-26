import IKurentoGuard = require("./IKurentoGuard");
import KurentoStatus = require("../KurentoStatus/KurentoStatus");
import Logger = require("../../Logger");
import BaseKurentoGuard = require("./BaseKurentoGuard");

class CpuKurentoGuard extends  BaseKurentoGuard.BaseKurentoGuard{
	public constructor(private cpuWarn:number, 
					   private cpuAlarm: number, 
					   warn: (status: KurentoStatus) => any, 
					   alarm: (status: KurentoStatus) => any,
					   private loging: boolean){
			super(loging,warn,alert);
	}
	
	public newStatus(status:KurentoStatus): void{
		if(status.cpu > this.cpuAlarm){
			this.onEvent(status, BaseKurentoGuard.WatcherEvent.Alarm );
			this.log(`cpu is HOT!Alarm! ${status.cpu}% > ${this.cpuAlarm}%`);
		}
		else if(status.cpu > this.cpuWarn){
			this.onEvent(status, BaseKurentoGuard.WatcherEvent.Warn );
			this.log(`cpu is more hot, than you want! Warning! ${status.cpu}% > ${this.cpuWarn}%`);
		}
		else{
			this.log(`cpu is nnormal state: ${status.cpu}%`);
		}
	}
		
}

export = CpuKurentoGuard;