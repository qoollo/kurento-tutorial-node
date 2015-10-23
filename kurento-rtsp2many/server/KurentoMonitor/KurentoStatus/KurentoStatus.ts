import MonitStatus = require('../MonitApi/MonitStatus');
import MonitState = require('../MonitApi/MonitState');
import KurentoEventState = require('./KurentoEventState');

class KurentoStatus{
	constructor(monitStatus: MonitStatus){		
		this.eventState = KurentoEventState.Unknown;
		this.time = new Date();
		var statuses = monitStatus ? monitStatus.processStatuses : null;
		var kurStatus = statuses ? statuses[0] : null;
		
		if(kurStatus){
			this.state = kurStatus.state;
			this.cpu = kurStatus.cpuLoad;
			this.memory = kurStatus.memoryPercent;
			this.uptime = kurStatus.uptime;				
		} 
		else{
			this.state = MonitState.Unknown;
			this.memory = 0;
			this.cpu = 0;
			this.uptime = 0;	
		}
	}
	
	public eventState: KurentoEventState;	
	public state: MonitState;
	public time: Date;
	public uptime: number;
	public memory: number;
	public cpu: number;
	
}

export = KurentoStatus;