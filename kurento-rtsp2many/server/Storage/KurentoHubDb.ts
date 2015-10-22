
import AppConfig = require('../AppConfig');


class KurentoHubDb {

	constructor() {
		//	Mongo me! Mongo me someone!
	}

	seedData(): Promise<any> {
		return new Promise((resolve, reject) => {
			AppConfig.config.kurentoMediaServer.defaultInstances.forEach((e, i) => {
				var template = AppConfig.config.kurentoMediaServer.wsUrlTemplate,
					getAddress = srv => {
						var res = template;
						for (var f in srv) {
							res = template.replace('${' + f + '}', srv[f]);
						}
						return res;
					};
				this.kurentoServers.push({
					_id: i.toString(),
					url: getAddress(e)
				})
			});
			resolve();
		});
	}

	getKurentoServers(): Promise<Storage.IKurentoServer[]> {
		return Promise.resolve(this.kurentoServers);
	}

	private kurentoServers: Storage.IKurentoServer[] = [];

	getRegisteredVideoConsumers(): Promise<Storage.IVideoConsumer[]> {
		return Promise.resolve(this.registeredVideoConsumers);
	}

	registerVideoConsumer(): Promise<Storage.IVideoConsumer> {
		var videoConsumer: Storage.IVideoConsumer = {
			clientId: this.registeredVideoConsumers.reduce((p, c) => Math.max(p, c.clientId), 1),
			registerTime: new Date(),
			streamConnections: []
		};
		this.registeredVideoConsumers.push(videoConsumer);
		return Promise.resolve(videoConsumer);
	}

	private registeredVideoConsumers: Storage.IVideoConsumer[] = [];

}

export = KurentoHubDb;