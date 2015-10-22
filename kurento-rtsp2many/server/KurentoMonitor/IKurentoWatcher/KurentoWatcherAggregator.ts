import IKurentoWatcher = require("./IKurentoWatcher");
import KurentoStatus = require("../KurentoStatus/KurentoStatus");
import Logger = require("../../Logger");
import BaseKurentoWatcher = require("./BaseKurentoWatcher");

class KurentoWatcherAggregator implements  IKurentoWatcher{
	public constructor(...private watchers: IKurentoWatcher[]){
	}
	
	public newStatus(status:KurentoStatus): void{
		for(var watcher of this.watchers){
			watcher.newStatus(status);		
		}
	}
		
}
export = KurentoWatcherAggregator;