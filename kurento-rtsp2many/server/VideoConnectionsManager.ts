
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
	
	public syncStreams(streamsToRun: Protocol.IVideoStream[]): Promise<any> {
		var meta = { 'class': 'VideoConnectionsManager', 'method': 'syncStreams' };
		this.logger.info('Syncing streams...', meta)
		var	res = this.getAllPlayers().then(players => {
				var toKill = players.filter(p => !streamsToRun.some(s => s.Url == p.streamUrl)),
					toCreate = streamsToRun.filter(s => !players.some(p => p.streamUrl == s.Url)),
					killPromises = toKill.map(p => p.server.killPlayer(p)),
					createPromises = toCreate.map(s => this.createVideo(s.Url)),
					allPromises = killPromises.concat(createPromises);
				
				this.logger.debug(`Syncing streams: ${toKill.length} to kill, ${toCreate.length} to create, ${players.length - toKill.length - toCreate.length} unchanged.`, meta);
				
				return Promise.all(allPromises);
			});
		res.then(() => this.logger.info('Sync streams complete.', meta))
			.catch(err => this.logger.error('Sync streams failed.', (meta['error'] = err, meta)));
			
		return res;
	}
	
	public createVideo(streamUrl: string): Promise<KurentoPlayer> {
		var meta = { 'class': 'VideoConnectionsManager', 'method': 'createVideoConnection' };
		return this.kurentoServers
			.then(servers => this.serverBalancer.getServerForStream(streamUrl, servers))
			.then(server => {
				this.logger.debug(`Server ${server.kurentoUrl} will be used.`, meta);
				return server.playVideo(streamUrl);
			});
	}

	public connectClientToStream(client: Storage.IVideoConsumer, sdpOffer: string, streamUrl: string): Promise<VideoConnection> {
		var meta = { 'class': 'VideoConnectionsManager', 'method': 'connectClientToStream' };
		return this.kurentoServers
			.then(servers => this.serverBalancer.getServerForStream(streamUrl, servers))
			.then(server => {
				this.logger.debug(`Server ${server.kurentoUrl} will be used.`, meta);
				return server.addVideoConnection(client, sdpOffer, streamUrl);
			});
	}

	public get runningStreams(): Promise<IVideoStream[]> {
		return this.getAllPlayers()
			.then(players => players.map(p => {
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
	
	private getAllPlayers(): Promise<KurentoPlayer[]> {
		return this.kurentoServers
			.then(servers => 
				servers
					.map(s => s.players)
					.reduce((p, c) => p.concat(c), []));
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