import MonitState = require("./MonitState");
import KurentoEventState = require('./KurentoEventState');

declare module Monitor {
	
	interface IKurentoStatus {
			state: KurentoEventState;
	
			status : MonitState;
			isMonitored : boolean;
			isPending : boolean;
			uptime : number;
			memory : number;
			cpu : number;	
	}
	
	interface IMonit {
		currentStatus: IKurentoStatus;
	}
}

export = Monitor;