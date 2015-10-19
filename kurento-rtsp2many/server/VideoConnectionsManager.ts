
import KurentoHubDb = require('./Storage/KurentoHubDb');
import KurentoServerBalancer = require('./KurentoServerBalancer');
import KurentoServer = require('./KurentoServer');
import KurentoPlayer = require('./KurentoPlayer');
import VideoConnection = require('./VideoConnection')

class VideoConnectionsManager {
	
	private db: KurentoHubDb;
	private serverBalancer: KurentoServerBalancer;
	private kurentoServers: KurentoServer[] = [];
	
	constructor(private logger: Console) {
		this.db = new KurentoHubDb();
		this.serverBalancer = new KurentoServerBalancer(this.logger, this.db);
	}
	
	public connectClientToStream(client: Storage.IVideoConsumer, streamUrl: string): Promise<void> {
		var server = this.serverBalancer.getServerForStream(streamUrl, this.kurentoServers);
		
		return Promise.reject('Not implemented');
	}
	
	ensureStreamConnection(server: KurentoServer, streamUrl: string): Promise<KurentoServer> {
		if (server.s)
	}
}

export = VideoConnectionsManager;