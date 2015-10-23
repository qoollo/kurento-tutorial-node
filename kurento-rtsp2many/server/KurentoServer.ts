
var KurentoClient: Kurento.Client.IKurentoClientConstructor = require('kurento-client');
import KurentoPlayer = require('./KurentoPlayer');
import PlayerStatus = require('./PlayerStatus');
import VideoConnection = require('./VideoConnection');
import when = require('when');

class KurentoServer {

	constructor(private _kurentoUrl: string, private logger: Console) {

	}

	public get kurentoUrl(): string {
		return this._kurentoUrl;
	}

	public get streamUrls(): string[] {
		return this._streamUrls;
	}
	private _streamUrls: string[] = [];

	public getVideoConnections(): VideoConnection[] {
		return this._videoConnections.slice();
	}
	public removeVideoConnection(streamUrl: string): Promise<any> {
		var match = this._videoConnections.filter(c => c.player.streamUrl == streamUrl)[0];
		if (!match)
			return Promise.reject(`Stream not found: KurentoServer "${this.kurentoUrl}" does not run stream "${streamUrl}".`);
		
		return match.player.dispose()
			.then(() => this._videoConnections.splice(this._videoConnections.indexOf(match), 1));
	}
	private _videoConnections: VideoConnection[] = [];

	public getClient(callback: IGetClientCallback): void {
		if (this._client !== null)
			return callback(null, this._client);
			
		this._clientCallbacks.push(callback);
		this.logger.debug(`[KurentoServer.getClient()] creating KurentoClient...`);
		new KurentoClient(this._kurentoUrl, (error, kurentoClient: Kurento.Client.IKurentoClient) => {
			if (error) {
				var msg = `[KurentoServer.getClient()] Failed to create KurentoClient. ${error}`;
				this.logger.error(msg);
				this._clientCallbacks.forEach(c => c(msg))
				return this._clientCallbacks.length = 0;
			}
			
			this.logger.debug(`[KurentoServer.getClient()] KurentoClient created.`);
			this._client = kurentoClient;
			this._clientCallbacks.forEach(c => c(null, kurentoClient))
			this._clientCallbacks.length = 0;
		});
	}
	private _clientCallbacks: IGetClientCallback[] = [];
	private _client: Kurento.Client.IKurentoClient = null;
	public get client(): Promise<Kurento.Client.IKurentoClient> {
		return this.clientPromise == null
			? this.clientPromise = this.createInternalClient()
			: this.clientPromise;
	}
	private clientPromise: Promise<Kurento.Client.IKurentoClient> = null;

	public getPlayer(streamUrl: string): Promise<KurentoPlayer> {
		var player = this.players.filter(p => p.streamUrl == streamUrl)[0];
		if (!player) {
			this.logger.debug(`[KurentoServer.getPlayer()] creating new KurentoPlayer for stream ${streamUrl}.`)
			player = new KurentoPlayer(this, streamUrl, this.logger);
			this.players.push(player);
		}
		if (player.status == PlayerStatus.Created)
			return Promise.resolve(player);
		else {
			return new Promise((resolve, reject) => {
				player.play(err => {
					if (err)
						return reject(err);
					resolve(player);
				});
			})
		}

	}
	private players: KurentoPlayer[] = [];

	public addVideoConnection(client: Storage.IVideoConsumer, sdpOffer: string, player: KurentoPlayer): Promise<VideoConnection> {
		return new Promise((resolve, reject) => {
			player.createVideoConnection(client, sdpOffer, (err, conn) => {
				if (err)
					return reject(err);

				this._videoConnections.push(conn);
				resolve(conn);
			});
		})
	}

	private createInternalClient(): Promise<Kurento.Client.IKurentoClient> {
		var deferred = when.defer<Kurento.Client.IKurentoClient>();
		this.logger.debug(`[KurentoServer.createInternalClient()] creating KurentoClient promise.`);
		new KurentoClient(this._kurentoUrl, (error, kurentoClient: Kurento.Client.IKurentoClient) => {
			if (error) {
				this.logger.error(`[KurentoServer.createInternalClient()] Failed to create KurentoClient. ${error}`);
				return deferred.reject(error);
			}
			this.logger.debug(`[KurentoServer.createInternalClient()] KurentoClient created. Resolving promise.`);
			deferred.resolve(kurentoClient);
		});
		return deferred.promise;

		this.logger.debug(`[KurentoServer.createInternalClient()] creating KurentoClient promise.`);
		return new Promise((resolve, reject) => {
			this.logger.debug(`[KurentoServer.createInternalClient()] creating KurentoClient.`);
			new KurentoClient(this._kurentoUrl, (error, kurentoClient: Kurento.Client.IKurentoClient) => {
				if (error) {
					this.logger.error(`[KurentoServer.createInternalClient()] Failed to create KurentoClient. ${error}`);
					return reject(error);
				}
				this.logger.debug(`[KurentoServer.createInternalClient()] KurentoClient created. Resolving promise.`);
				resolve(kurentoClient);
			});
		});
	}
}

interface IGetClientCallback {
	(err, client?: Kurento.Client.IKurentoClient): void;
}

export = KurentoServer;