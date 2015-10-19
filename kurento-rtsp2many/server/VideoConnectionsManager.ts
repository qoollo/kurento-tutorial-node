
import KurentoHubDb = require('./Storage/KurentoHubDb');
import KurentoServerBalancer = require('./KurentoServerBalancer');
import KurentoServer = require('./KurentoServer');
import KurentoPlayer = require('./KurentoPlayer');
import VideoConnection = require('./VideoConnection');

class VideoConnectionsManager {
	
	private serverBalancer: KurentoServerBalancer;
	private kurentoServers: Promise<KurentoServer[]>;
	
	constructor(private db: KurentoHubDb, private logger: Console) {
		this.serverBalancer = new KurentoServerBalancer(this.logger, this.db);
		this.kurentoServers = this.getKurentoServers();
	}
		
	public connectClientToStream(client: Storage.IVideoConsumer, sdpOffer: string, streamUrl: string): Promise<VideoConnection> {
		return this.kurentoServers
			.then(servers => this.serverBalancer.getServerForStream(streamUrl, servers))
			.then(server =>  {
				this.logger.debug(`[VideoConnectionsManager.connectClientToStream()] Server ${server.kurentoUrl} will be used.`);
				return server.getPlayer(streamUrl)
				 	.then(player => server.addVideoConnection(client, sdpOffer, player));
			});
	}
	
	private getKurentoServers(): Promise<KurentoServer[]> {
		return this.db.getKurentoServers()
			.then(servers => servers.map(s => new KurentoServer(s.url, this.logger)));
	}
}

export = VideoConnectionsManager;