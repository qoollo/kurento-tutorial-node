
var KurentoClient: Kurento.Client.IKurentoClientConstructor = require('kurento-client');
import KurentoPlayer = require('./KurentoPlayer');
import PlayerStatus = require('./PlayerStatus');
import VideoConnection = require('./VideoConnection');

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
	private _videoConnections: VideoConnection[] = [];

	public get client(): Promise<Kurento.Client.IKurentoClient> {
		return this.clientPromise == null
			? this.clientPromise = this.createInternalClient()
			: this.clientPromise;
	}
	private clientPromise: Promise<Kurento.Client.IKurentoClient> = null;

	public getPlayer(streamUrl: string): Promise<KurentoPlayer> {
		var player = this.players.filter(p => p.streamUrl == streamUrl)[0];
		if (!player) {
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
		return new Promise((resolve, reject) => {
			new KurentoClient(this._kurentoUrl, (error, kurentoClient: Kurento.Client.IKurentoClient) => {
				if (error)
					return reject(error);
				resolve(kurentoClient);
			});
		});
	}
}

export = KurentoServer;