
import KurentoHubDb = require('./Storage/KurentoHubDb');
import KurentoServerBalancer = require('./KurentoServerBalancer');
import KurentoServer = require('./KurentoServer');
import KurentoPlayer = require('./KurentoPlayer');
import VideoConnection = require('./VideoConnection');

class VideoConnectionsManager {
	
	private db: KurentoHubDb;
	private serverBalancer: KurentoServerBalancer;
	private kurentoServers: KurentoServer[] = [];
	
	constructor(private logger: Console) {
		this.db = new KurentoHubDb();
		this.serverBalancer = new KurentoServerBalancer(this.logger, this.db);
	}
	
	public connectClientToStream(client: Storage.IVideoConsumer, sdpOffer: string, streamUrl: string): Promise<VideoConnection> {
		return this.serverBalancer.getServerForStream(streamUrl, this.kurentoServers)
			.then(server => 
				server.getPlayer(streamUrl)
				 	.then(player => server.addVideoConnection(client, sdpOffer, player)));
	}
}

export = VideoConnectionsManager;