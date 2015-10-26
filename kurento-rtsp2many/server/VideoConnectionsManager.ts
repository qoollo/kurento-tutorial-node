
import KurentoHubDb = require('./Storage/KurentoHubDb');
import KurentoServerBalancer = require('./KurentoServerBalancer');
import KurentoServer = require('./KurentoServer');
import KurentoPlayer = require('./KurentoPlayer');
import PlayerStatus = require('./PlayerStatus');
import VideoConnection = require('./VideoConnection');

class VideoConnectionsManager {

	private serverBalancer: KurentoServerBalancer;
	private kurentoServers: Promise<KurentoServer[]>;

	constructor(private db, private logger: Console) {
		this.serverBalancer = new KurentoServerBalancer(this.logger, this.db);
		this.kurentoServers = this.getKurentoServers();
	}

	public connectClientToStream(client: Storage.IVideoConsumer, sdpOffer: string, streamUrl: string): Promise<VideoConnection> {
		return this.kurentoServers
			.then(servers => this.serverBalancer.getServerForStream(streamUrl, servers))
			.then(server => {
				this.logger.debug(`[VideoConnectionsManager.connectClientToStream()] Server ${server.kurentoUrl} will be used.`);
				return server.addVideoConnection(client, sdpOffer, streamUrl);
			});
	}

	public get runningStreams(): Promise<IVideoStream[]> {
		return this.kurentoServers.then(servers =>
			servers
				.map(s => s.players)
				.reduce((p, c) => p.concat(c), [])
				.map(p => {
					return {
						streamUrl: p.streamUrl,
						kurentoServerUrl: p.server.kurentoUrl,
						clients: p.videoConnections.map(c => c.client),
						killInProgress: p.status == PlayerStatus.Disposed
					}
				}));
	}

	public killStream(streamUrl): Promise<any> {
		return this.kurentoServers.then(servers => Promise.all(servers.map(s => s.killVideoConnection(streamUrl))));
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
	killInProgress: boolean;
}

export = VideoConnectionsManager;