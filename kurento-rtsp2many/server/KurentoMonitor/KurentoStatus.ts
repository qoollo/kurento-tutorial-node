import MonitStatus = require('./MonitStatus');
import KurentoEventState = require('./KurentoEventState');
import Monitor = require('./Monitor');

class KurentoStatus implements Monitor.IKurentoStatus{
	constructor(monitStatus: MonitStatus){		
		this.state = KurentoEventState.Unknown;
	}
	
	public state: KurentoEventState;
	
	public status;
	public isMonitored;
	public isPending;
	public uptime;
	public memory;
	public cpu;	
}

export = KurentoStatus;