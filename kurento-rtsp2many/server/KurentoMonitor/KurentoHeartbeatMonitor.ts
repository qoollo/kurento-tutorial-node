import logger = require('../Logger');
import MonitUrl = require('./MonitUrl');
import KurentoStatus = require('./KurentoStatus');
import KurentoHubDb = require('../Storage/KurentoHubDb');
import MonitApiClient = require('./MonitApiCLient');
import Monit = require('./Monit');
import MonitStatus = require('./MonitStatus');
import KurentoEventState = require('./KurentoEventState');

/*  
 *	Class to monitoring Kurentos by theirs Monits
 *  Get state for each kurento, generate event and write it to db. 
 */
class KurentoHeartbeatMonitor{
	constructor(private timer:any, 
				private timeout: number){				
		this.monitApi = new MonitApiClient();
		this.db = new KurentoHubDb();
	}
	
	public start(url: MonitUrl): void {
		this.startedMonits[url.getUrl()] = new Monit(url);	
		logger.log('info',`[KurentoHeartbeatMonitor] Monit with url ${url.getUrl()} was started to monitoring`)	
	}
	
	public stop(url: MonitUrl): void {	
		delete this.startedMonits[url.getUrl()];
		logger.log('info',`[KurentoHeartbeatMonitor] Monitoring Monit with url ${url.getUrl()} was stoped`)
	}
		
	private timerCallback(): void {
		for (var key in this.startedMonits){
			var monit = this.startedMonits[key];
			if(monit && monit instanceof Monit)
				this.updateKurentoStatus(monit);			
		}
	}

	private updateKurentoStatus(monit:Monit): void{
		this.getMonitStatusFromMonit(monit)
			.then((monitStatus: MonitStatus) => {
				return Promise.all([this.getKurentoStatusFromDB(monit), 
									Promise.resolve(new KurentoStatus(monitStatus))]);
			})
			.then(([dbStatus,mStatus]) => {			
				return this.analiseKurentoStatuses(dbStatus,mStatus);
			})
			.then((status: KurentoStatus) => {
				return this.setKurentoStatus(status);				
			})
			.then((status:KurentoStatus) => {
				this.raiseKurentoStatus(status);				
			})
			.catch((e)=>{
				console.log('error', e);
			})
		
	}
	

	private setKurentoStatus(status: KurentoStatus):Promise<KurentoStatus>{	
		return new Promise((resolve, reject) =>{
			//db
			resolve(status);
		});
	}
	
	private analiseKurentoStatuses(dbStatus: KurentoStatus,mStatus: KurentoStatus): Promise<KurentoStatus>{
		switch(dbStatus.state){
			case KurentoEventState.Unknown:
			
			break;
			case KurentoEventState.OnOffline:
			
			break;
			case KurentoEventState.OnOnline:
			break;
			case KurentoEventState.OnRestart:
			break;
			
		}
		return null;	
	}
	
	private getKurentoStatusFromDB(monit: Monit): KurentoStatus{
		this.db.getKurentoServers();
		return null;
	}
	
	private getMonitStatusFromMonit(monit: Monit): Promise<MonitStatus>{		
		return this.monitApi.getMonitStatus(monit.url);
	}

	private raiseKurentoStatus(status: KurentoStatus): void{
		switch(status.state)
		{
			case KurentoEventState.OnOffline:
				this.raiseEvent(this.onOffline, status);
				break;
			case KurentoEventState.OnOnline:
				this.raiseEvent(this.onOnline, status);
				break;
			case KurentoEventState.OnRestart:
				this.raiseEvent(this.onRestart, status);
				break;
		}	
		this.raiseEvent(this.onStatus,status);
	}	
	
	private raiseEvent(event:(status:any) => void, status: any){
		if(event){
			event(status);
			logger.log('debug',`[KurentoHeartbeatMonitor] raiseEvent`)
		}
	}
	
	private monitApi: MonitApiClient;
	private db: KurentoHubDb;
	private startedMonits: Monit[];	
	public onStatus: (status:KurentoStatus) => void;
	public onOnline: (status:KurentoStatus) => void;
	public onOffline: (status:KurentoStatus) => void;
	public onRestart: (status:KurentoStatus) => void;
}

export = KurentoHeartbeatMonitor;

