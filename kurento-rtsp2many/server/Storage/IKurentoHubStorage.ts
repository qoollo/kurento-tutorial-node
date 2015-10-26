import Monitor = require('../KurentoMonitor/Monitor');

export interface IKurentoHubStorage {
	
	seedData(): Promise<any>
	
	getKurentoServers(): Promise<Storage.IKurentoServer[]>
	
	getRegisteredVideoConsumers(): Promise<Storage.IVideoConsumer[]>
	
	registerVideoConsumer(): Promise<Storage.IVideoConsumer>
	
	saveMonit(monit : Monitor.IMonit) : Promise<any>
	
	getLastMonitUrl() : Promise<Monitor.IMonitUrl>
}