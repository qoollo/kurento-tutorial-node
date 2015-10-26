import IKurentoGuard = require("./IKurentoGuard");
import KurentoStatus = require("../KurentoStatus/KurentoStatus");
import Logger = require("../../Logger");
import BaseKurentoGuard = require("./BaseKurentoGuard");

class KurentoGuardAggregator implements  IKurentoGuard{
	public constructor(...guards: IKurentoGuard[]){
		this.guards = guards;
	}
	
	private guards: IKurentoGuard[];
	
	public newStatus(status:KurentoStatus): void{
		for(var guard of this.guards){
			guard.newStatus(status);		
		}
	}
		
}
export = KurentoGuardAggregator;