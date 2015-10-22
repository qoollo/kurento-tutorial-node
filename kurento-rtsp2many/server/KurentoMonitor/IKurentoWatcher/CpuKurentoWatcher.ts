import IKurentoWatcher = require("./IKurentoWatcher");
import KurentoStatus = require("../KurentoStatus/KurentoStatus");
import Logger = require("../../Logger");
import BaseKurentoWatcher = require("./BaseKurentoWatcher");

class CpuKurentoWatcher extends  BaseKurentoWatcher.BaseKurentoWatcher{
	public constructor(private cpuWarn:number, 
					   private cpuAlarm: number, 
					   warn: (status: KurentoStatus) => any, 
					   alarm: (status: KurentoStatus) => any,
					   private loging: boolean){
			super(loging,warn,alert);
	}
	
	public newStatus(status:KurentoStatus): void{
		if(status.cpu > this.cpuAlarm){
			this.onEvent(status, BaseKurentoWatcher.WatcherEvent.Alarm );
			this.log(`cpu is HOT!Alarm! ${status.cpu}% > ${this.cpuAlarm}%`);
		}
		else if(status.cpu > this.cpuWarn){
			this.onEvent(status, BaseKurentoWatcher.WatcherEvent.Warn );
			this.log(`cpu is more hot, than you want! Warning! ${status.cpu}% > ${this.cpuWarn}%`);
		}
		else{
			this.log(`cpu is nnormal state: ${status.cpu}%`);
		}
	}
		
}

export = CpuKurentoWatcher;