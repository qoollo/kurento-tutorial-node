import logger = require('../Logger');
import MonitUrl = require('./Monit/MonitUrl');
import KurentoStatus = require('./KurentoStatus/KurentoStatus');
import KurentoHubDb = require('../Storage/IKurentoHubStorage');
import MonitApiClient = require('./MonitApi/MonitApiCLient');
import Monit = require('./Monit/Monit');
import MonitStatus = require('./MonitApi/MonitStatus');
import MonitState = require('./MonitApi/MonitState');
import KurentoEventState = require('./KurentoStatus/KurentoEventState');
import IKurentoWatcher = require("./IKurentoWatcher/IKurentoWatcher");
import KurentoHubDbProvider = require('../Storage/KurentoHubDbProvider');
/*  
 *	Class to monitoring Kurentos by theirs Monits
 *  Get state for each kurento, generate event and write it to db. 
 */
class KurentoHeartbeatMonitor{
	constructor(private timer:ITimer, 
				private interval: number,
				private kurentoWatcher: IKurentoWatcher){				
		this.monitApi = new MonitApiClient();
		KurentoHubDbProvider.get().then((db) => {this.db = db});
		timer.setInterval(this.timerCallback, interval);
		logger.log('info',`[KurentoHeartbeatMonitor] was started`)	
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

	private updateKurentoStatus(monit: Monit): void{
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
		if(mStatus.uptime < dbStatus.uptime){
			mStatus.eventState = KurentoEventState.OnRestart;	
		}
		else{
			switch(dbStatus.state){
				case MonitState.Unknown:
					
					break;
				case MonitState.Initializing:
					break;
				case MonitState.NotMonitoring:
					break;
				case MonitState.Running:
				
					break;
			}	
				
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
		switch(status.eventState)
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
	private db : KurentoHubDb.IKurentoHubStorage;
	private startedMonits: Monit[];	
	public onStatus: (status:KurentoStatus) => void;
	public onOnline: (status:KurentoStatus) => void;
	public onOffline: (status:KurentoStatus) => void;
	public onRestart: (status:KurentoStatus) => void;
}

export = KurentoHeartbeatMonitor;

