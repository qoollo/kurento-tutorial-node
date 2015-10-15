import logger = require('../Logger');
import MonitUrl = require('./MonitUrl');
import KurentoStatus = require('./KurentoStatus');
import KurentoHubDb = require('../Storage/KurentoHubDb');

class KurentoHeartbeatMonitor{
	
	public start(url: MonitUrl):void{
		
		
	}
	public stop(url: MonitUrl):void{
		
		
	}
	
	public onstatus: (status:KurentoStatus) => void;
	public ononline: (status:KurentoStatus) => void;
	public onoffline: (status:KurentoStatus) => void;
	public onrestart: (status:KurentoStatus) => void;
	
	private monit: any;
	private db: KurentoHubDb;
	private timer: any;
	
	
}

export = KurentoHeartbeatMonitor;