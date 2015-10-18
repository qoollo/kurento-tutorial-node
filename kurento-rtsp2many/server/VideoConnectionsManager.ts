
import KurentoHubDb = require('./Storage/KurentoHubDb');
import KurentoServerBalancer = require('./KurentoServerBalancer');
import KurentoClient = require('./KurentoClient');
import KurentoPlayer = require('./KurentoPlayer');

class VideoConnectionsManager {
	
	private db: KurentoHubDb;
	private serverBalancer: KurentoServerBalancer;
	
	constructor() {
		this.db = new KurentoHubDb();
		this.serverBalancer = new KurentoServerBalancer(this.db);
	}
	
	public connectClientToStream(client: Storage.IVideoConsumer, streamUrl: string): Promise<void> {
		
		return Promise.reject('Not implemented');
	}
}

export = VideoConnectionsManager;