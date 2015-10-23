import MonitState = require('./MonitApi/MonitState');
import KurentoEventState = require('./KurentoStatus/KurentoEventState');

declare module Monitor {
	
	interface IKurentoStatus {
			eventState: KurentoEventState;
			state : MonitState;
			time : Date;
			uptime : number;
			memory : number;
			cpu : number;	
	}
	
	interface IMonit {
		currentStatus: IKurentoStatus;
	}
}

export = Monitor;