import Monitor = require('../KurentoMonitor/Monitor');
import DbState = require('./DbState');

export interface IKurentoHubStorage {
	
	state: DbState;
	
	seedData(): Promise<any>
	
	getKurentoServers(): Promise<Storage.IKurentoServer[]>
	
	getRegisteredVideoConsumers(): Promise<Storage.IVideoConsumer[]>
	
	registerVideoConsumer(): Promise<Storage.IVideoConsumer>
	
	saveMonit(monit : Monitor.IMonit) : Promise<any>
	
	getLastMonitUrl() : Promise<Monitor.IMonitUrl>
}