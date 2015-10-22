import MonitStatus = require('./MonitStatus');
import KurentoEventState = require('./KurentoEventState');

class KurentoStatus{
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