
var KurentoClient: Kurento.Client.IKurentoClientConstructor = require('kurento-client');
import KurentoPlayer = require('./KurentoPlayer');
import VideoConnection = require('./VideoConnection');

class KurentoServer {

	constructor(private _kurentoUrl: string) {

	}

	public get kurentoUrl(): string {
		return this._kurentoUrl;
	}
	
	public get streamUrls(): string[] {
		return this._streamUrls;
	}
	private _streamUrls: string[] = [];
	
	public get videoConnections(): VideoConnection[] {
		return this._videoConnections;
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
			player = new KurentoPlayer(this, streamUrl);
			this.players.push(player);
		}
		return Promise.resolve(player);
	}
	private players: KurentoPlayer[] = [];
	
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