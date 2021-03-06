
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

	public getVideoConnections(): VideoConnection[] {
		return this._players.map(p => p.videoConnections).reduce((p, c) => p.concat(c), <VideoConnection[]>[]);
	}
	public killVideoConnection(streamUrl: string): Promise<any> {
		var match = this._players.filter(p => p.streamUrl == streamUrl)[0];
		if (!match)
			return Promise.reject(`Stream not found: KurentoServer "${this.kurentoUrl}" does not run stream "${streamUrl}".`);
			
		return this.killPlayer(match);
	}
	public killPlayer(player: KurentoPlayer): Promise<any> {
		if (player.status == PlayerStatus.Disposed)
			return Promise.resolve(`Stream kill has already been initiated.`);

		return player.dispose()
			.then(() => this._players.splice(this._players.indexOf(player), 1));
	}

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

	private getPlayer(streamUrl: string): Promise<KurentoPlayer> {
		var player = this._players.filter(p => p.streamUrl == streamUrl)[0];
		if (!player || player.status == PlayerStatus.Disposed) {
			this.logger.debug(`[KurentoServer.getPlayer()] creating new KurentoPlayer for stream ${streamUrl}.`)
			player = new KurentoPlayer(this, streamUrl, this.logger);
			this._players.push(player);
		}
		if (player.status == PlayerStatus.Created)
			return Promise.resolve(player);
		else {
			return new Promise((resolve, reject) => {
				player.play(err => {
					if (err) {
						this._players.splice(this._players.indexOf(player, 1));
						return reject(err);
					}
					resolve(player);
				});
			})
		}

	}
	public get players(): KurentoPlayer[] {
		return this._players;
	}
	private _players: KurentoPlayer[] = [];

	public playVideo(streamUrl: string): Promise<KurentoPlayer> {
		return this.getPlayer(streamUrl);
	}

	public addVideoConnection(client: Storage.IVideoConsumer, sdpOffer: string, streamUrl: string): Promise<VideoConnection> {
		return new Promise((resolve, reject) => {
			this.getPlayer(streamUrl)
				.then(player => {
					player.createVideoConnection(client, sdpOffer, (err, conn) => {
						if (err)
							return reject(err);

						resolve(conn);
					});
				}, reject);
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