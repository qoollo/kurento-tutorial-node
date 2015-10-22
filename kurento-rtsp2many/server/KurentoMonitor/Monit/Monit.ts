import MonitUrl = require('../Monit//MonitUrl');
import KurentoStatus = require('../KurentoStatus/KurentoStatus');

/*
 * Class represents a Monit instance to monitoring with some url
 */
class Monit{
	constructor(public url:MonitUrl){			
	}
	
	public currentStatus: KurentoStatus;
}

export = Monit;