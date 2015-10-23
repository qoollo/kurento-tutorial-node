import MonitUrl = require('./MonitUrl');
import KurentoStatus = require('../KurentoStatus/KurentoStatus');
import Monitor = require('../Monitor');

/*
 * Class represents a Monit instance to monitoring with some url
 */
class Monit implements Monitor.IMonit {
	constructor(public url:MonitUrl){			
	}
	
	public currentStatus: KurentoStatus;
}

export = Monit;