import MonitStatus = require('./MonitStatus');
import KurentoState = require('./KurentoState');

class KurentoStatus{
	constructor(monitStatus: MonitStatus){
		
		
	}
	
	public state: KurentoState;
	
	public status;
	public isMonitored;
	public isPending;
	public uptime;
	public memory;
	public cpu;	
}

export = KurentoStatus;