import logger = require('../Logger');
import MonitUrl = require('./Monit/MonitUrl');
import KurentoStatus = require('./KurentoStatus/KurentoStatus');
import KurentoHubDb = require('../Storage/IKurentoHubStorage');
import MonitApiClient = require('./MonitApi/MonitApiCLient');
import Monit = require('./Monit/Monit');
import MonitStatus = require('./MonitApi/MonitStatus');
import MonitState = require('./MonitApi/MonitState');
import KurentoEventState = require('./KurentoStatus/KurentoEventState');
import IKurentoGuard = require("./IKurentoGuard/IKurentoGuard");
import KurentoStatusAnaliser = require("./KurentoSTatusAnaliser");
import KurentoWatcher = require("./KurentoWatcher");
import ITimer = require("../Timer/ITimer");
import KurentoHubDbProvider = require('../Storage/KurentoHubDbProvider');
/*  
 *	Class to monitoring Kurentos by theirs Monits
 *  Get state for each kurento, generate event and write it to db. 
 */
class KurentoHeartbeatMonitor{
	constructor(timer:ITimer, 
				interval: number,
				private kurentoGuard: IKurentoGuard){				
		this.monitApi = new MonitApiClient();
		this.kurentoWatcher = new KurentoWatcher(timer, interval, (monit)=>this.updateKurentoStatus(monit));
		this.kurentoAnaliser = new KurentoStatusAnaliser();
		KurentoHubDbProvider.get().then((db) => {this.db = db});
		logger.log('info',`[KurentoHeartbeatMonitor] was started`)	
	}
	
	public start(url: MonitUrl): void {
		this.kurentoWatcher.start(url);
		logger.log('info',`[KurentoHeartbeatMonitor] Monit with url ${url.getUrl()} was started to monitoring`)	
	}
	
	public stop(url: MonitUrl): void {	
		this.kurentoWatcher.stop(url);
		logger.log('info',`[KurentoHeartbeatMonitor] Monitoring Monit with url ${url.getUrl()} was stoped`)
	}
		
	private updateKurentoStatus(monit: Monit): void{
		this.getMonitStatusFromMonit(monit)
			.then((monitStatus: MonitStatus) => {
				return Promise.all([this.getKurentoStatusFromDB(monit), 
									Promise.resolve(new KurentoStatus(monitStatus))]);
			})
			.then(([dbStatus,mStatus]) => {			
				return this.kurentoAnaliser.analise(dbStatus,mStatus);
			})
			.then((status: KurentoStatus) => {
				return this.setKurentoStatus(status);				
			})
			.then((status:KurentoStatus) => {
				this.raiseKurentoStatus(status);	
				this.guardKurento(status);			
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
	
	
	private getKurentoStatusFromDB(monit: Monit): Promise<KurentoStatus>{
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
	
	private guardKurento(status: KurentoStatus){
		if (this.kurentoGuard){
			this.kurentoGuard.newStatus(status);
		}
	}
	
	private monitApi: MonitApiClient;
	private kurentoAnaliser: KurentoStatusAnaliser;
	private kurentoWatcher: KurentoWatcher;
	private db : KurentoHubDb.IKurentoHubStorage;
	public onStatus: (status:KurentoStatus) => void;
	public onOnline: (status:KurentoStatus) => void;
	public onOffline: (status:KurentoStatus) => void;
	public onRestart: (status:KurentoStatus) => void;
}

export = KurentoHeartbeatMonitor;

