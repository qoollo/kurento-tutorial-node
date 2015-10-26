import MonitState = require('./MonitApi/MonitState');
import KurentoEventState = require('./KurentoStatus/KurentoEventState');
import url = require('url');

declare module Monitor {
	
	interface IKurentoStatus {
			eventState: KurentoEventState;
			state : MonitState;
			time : Date;
			uptime : number;
			memory : number;
			cpu : number;	
	}
	
	interface IMonitUrl {
		monitUrl: url.Url;
	}
	
	interface IMonit {
		url : IMonitUrl
		currentStatus: IKurentoStatus;
	}
}

export = Monitor;