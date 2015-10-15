
class KurentoHubDb {
	
	constructor() {
		//	Mongo me! Mongo me someone!
	}
	
	getRegisteredVideoConsumers(): Promise<Storage.IVideoConsumer[]> {
		return Promise.resolve(this.registeredVideoConsumers);
	}
	
	registerVideoConsumer(): Promise<Storage.IVideoConsumer> {
		var videoConsumer: Storage.IVideoConsumer = { 
			clientId: this.registeredVideoConsumers.reduce((p, c) => Math.max(p, c.clientId), 1),
			registerTime: new Date()
		};
		this.registeredVideoConsumers.push(videoConsumer);
		return Promise.resolve(videoConsumer);
	}
	
	private registeredVideoConsumers: Storage.IVideoConsumer[] = [];
	
}

export = KurentoHubDb;