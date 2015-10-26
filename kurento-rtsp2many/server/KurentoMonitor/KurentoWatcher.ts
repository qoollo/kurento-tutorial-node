import Monit = require("./Monit/Monit");
import MonitUrl = require("./Monit/MonitUrl");
import ITimer = require("../Timer/ITimer");

class KurentoWatcher {
	constructor(private timer:ITimer,
				private interval: number,
				private watcherCallback: (monit:Monit)=>any){
					
		this.startedMonits = [];
		timer.setInterval(this.timerCallback, interval);
	}

	public start(url: MonitUrl): void {
		this.startedMonits[url.getUrl()] = new Monit(url);	
	}
	
	public stop(url: MonitUrl): void {	
		delete this.startedMonits[url.getUrl()];
	}
		
	private timerCallback(): void {
		for (var key in this.startedMonits){
			var monit = this.startedMonits[key];
			if(monit && monit instanceof Monit)
				this.watcherCallback(monit);			
		}
	}	
	
	
	private startedMonits: Monit[];	
}

export = KurentoWatcher;