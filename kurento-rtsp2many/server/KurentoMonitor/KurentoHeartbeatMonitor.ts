import logger = require('../Logger');
import MonitUrl = require('./MonitUrl');
import KurentoStatus = require('./KurentoStatus');
import KurentoHubDb = require('../Storage/KurentoHubDb');
import MonitApiClient = require('./MonitApiCLient');
import Monit = require('./Monit');
import MonitStatus = require('./MonitStatus');
import KurentoState = require('./KurentoState');


class KurentoHeartbeatMonitor{
	constructor(private timer:any, 
				private timeout: number){
					
		this.monitApi = new MonitApiClient();
		this.db = new KurentoHubDb();

	}

	public onstatus: (status:KurentoStatus) => void;
	public ononline: (status:KurentoStatus) => void;
	public onoffline: (status:KurentoStatus) => void;
	public onrestart: (status:KurentoStatus) => void;
	
	public start(url: MonitUrl): void {
		this.startedMonits.push(new Monit(url));		
	}
	
	public stop(url: MonitUrl): void {	
	}
	
	
	private raiseEvent(event:(status:any) => void, status: any){
		if(event)
			event(status);
	}
	
	private timerCallback(): void {
		for (var i=0;i<this.startedMonits.length;i++){
			this.monitApi.getMonitStatus(this.startedMonits[i].url).then( this.successStatus, this.errorStatus);				
		}
	}
	
	private successStatus(monitStatus: MonitStatus): void{
		var kurentoStatus: KurentoStatus = new KurentoStatus(monitStatus); 
		var oldKurentoStatus: KurentoStatus = this.getKurentoStatusFromDB();
		
		
		this.raiseEvent(this.onstatus, kurentoStatus);	
	}
	
	
	
	private getKurentoStatusFromDB(): KurentoStatus{
		
		return null;
	}
	
	private getKurentoStatusFromMonit(): KurentoStatus{
		
		return null;
	}
	
	private errorStatus(error: any): void{
		
		
	}
	
	private monitApi: MonitApiClient;
	private db: KurentoHubDb;
	
	private startedMonits: Monit[];

	
	
	
}

export = KurentoHeartbeatMonitor;

