import Db = require('./Mongo/KurentoMongoDb');
import KhStorage = require('./IKurentoHubStorage')

class KurentoHubProvider {

	private lastGetPromise: Promise<KhStorage.IKurentoHubStorage>

	constructor() {

	}

	get(): Promise<KhStorage.IKurentoHubStorage> {
		if (!this.lastGetPromise)
			this.lastGetPromise = new Promise((resolve, reject) => {
				Db.connect().then(() => {
					resolve(Db)
				}, (err) => {
					reject(err)
				});
			})
		
		return this.lastGetPromise;
	}
}

export = new KurentoHubProvider();