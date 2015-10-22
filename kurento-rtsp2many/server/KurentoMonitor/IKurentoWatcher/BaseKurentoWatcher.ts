import IKurentoWatcher = require("./IKurentoWatcher");
import KurentoStatus = require("../KurentoStatus/KurentoStatus");
import Logger = require("../../Logger");

export enum WatcherEvent{
	Warn,
	Alarm	
}

export class BaseKurentoWatcher implements IKurentoWatcher{
	constructor(protected logging: boolean = false, 
				protected warn: (status: KurentoStatus) => any = null, 
				protected alarm: (status: KurentoStatus) => any = null){
	}
	
	protected logging;
	
	public abstract newStatus(status:KurentoStatus): void;		
	
	protected onEvent(status: KurentoStatus, event: WatcherEvent ){
		switch(event){
			case WatcherEvent.Warn:
				if(this.warn)
					this.warn(status);
				break;
			case WatcherEvent.Alarm:
				if(this.alert)
					this.alarm(status);
				break;	
		}
	}
	
	protected log(msg:string, level: string = 'info'){
		if(this.logging)
			Logger.log('info',`[CpuKurentoWatcher]: ${msg}`);	
	}
	
}

