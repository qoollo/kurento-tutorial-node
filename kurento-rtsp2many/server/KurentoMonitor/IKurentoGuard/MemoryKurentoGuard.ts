import IKurentoGuard = require("./IKurentoGuard");
import KurentoStatus = require("../KurentoStatus/KurentoStatus");
import Logger = require("../../Logger");
import BaseKurentoGuard = require("./BaseKurentoGuard");

class MemoryKurentoGuard extends  BaseKurentoGuard.BaseKurentoGuard{
	public constructor(private memWarn:number, 
					   private memAlarm: number, 
					   warn: (status: KurentoStatus) => any, 
					   alarm: (status: KurentoStatus) => any,
					   private loging: boolean){
			super(loging,warn,alert);
	}
	
	public newStatus(status:KurentoStatus): void{
		if(status.memory > this.memAlarm){
			this.onEvent(status, BaseKurentoGuard.WatcherEvent.Alarm );
			this.log(`memory is HOT!Alarm! ${status.memory}% > ${this.memAlarm}%`);
		}
		else if(status.memory > this.memWarn){
			this.onEvent(status, BaseKurentoGuard.WatcherEvent.Warn );
			this.log(`memory is more used, than you want! Warning! ${status.memory}% > ${this.memWarn}%`);
		}
		else{
			this.log(`memory in normal state: ${status.memory}%`);
		}
	}
		
}

export = MemoryKurentoGuard