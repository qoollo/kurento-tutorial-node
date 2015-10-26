import IKurentoGuard = require("./IKurentoGuard");
import KurentoStatus = require("../KurentoStatus/KurentoStatus");
import Logger = require("../../Logger");

export enum WatcherEvent{
	Warn,
	Alarm	
}

export abstract class BaseKurentoGuard implements IKurentoGuard{
	constructor(protected logging: boolean = false, 
				protected warn: (status: KurentoStatus) => any = null, 
				protected alarm: (status: KurentoStatus) => any = null){
	}
	
	
	public abstract newStatus(status:KurentoStatus): void;		
	
	protected onEvent(status: KurentoStatus, event: WatcherEvent ){
		switch(event){
			case WatcherEvent.Warn:
				if(this.warn)
					this.warn(status);
				break;
			case WatcherEvent.Alarm:
				if(this.alarm)
					this.alarm(status);
				break;	
		}
	}
	
	protected log(msg:string, level: string = 'info'){
		if(this.logging)
			Logger.log('info',`[CpuKurentoWatcher]: ${msg}`);	
	}
	
}

