
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
			.then(server => {
				this.logger.debug(`[VideoConnectionsManager.connectClientToStream()] Server ${server.kurentoUrl} will be used.`);
				return server.getPlayer(streamUrl)
					.then(player => server.addVideoConnection(client, sdpOffer, player));
			});
	}

	public get runningStreams(): Promise<IVideoStream[]> {
		return this.kurentoServers.then(servers => {
			var res: IVideoStream[] = [];
			servers.forEach(s => 
				s.getVideoConnections().forEach(conn => {
					var match = res.filter(e => e.streamUrl == conn.player.streamUrl)[0];
					if (!match)
						res.push({
							streamUrl: conn.player.streamUrl,
							kurentoServerUrl: s.kurentoUrl,
							clients: [conn.client]
						});
					else
						match.clients.push(conn.client);
				}));
			return res;
		});
	}
	
	public killStream(streamUrl): Promise<any> {		
		return this.kurentoServers	
			.then(servers => servers.filter(s => s.getVideoConnections().some(c => c.player.streamUrl == streamUrl)))
			.then(servers => Promise.all(servers.map(s => s.removeVideoConnection(streamUrl))));
	}

	private getKurentoServers(): Promise<KurentoServer[]> {
		return this.db.getKurentoServers()
			.then(servers => servers.map(s => new KurentoServer(s.url, this.logger)));
	}
}

interface IVideoStream {
	streamUrl: string;
	kurentoServerUrl: string;
	clients: Protocol.IClientId[];
}

export = VideoConnectionsManager;