
var KurentoClientInternal: Kurento.Client.IKurentoClientConstructor = require('kurento-client');


class KurentoClient {

	constructor(private _kurentoUrl: string) {

	}

	public get kurentoUrl(): string {
		return this._kurentoUrl;
	}

	public get client(): Promise<Kurento.Client.IKurentoClient> {
		return this.clientPromise == null 
			? this.clientPromise = this.createInternalClient() 
			: this.clientPromise;
	}
	private clientPromise: Promise<Kurento.Client.IKurentoClient> = null;

	private createInternalClient(): Promise<Kurento.Client.IKurentoClient> {
		return new Promise((resolve, reject) => {
			new KurentoClientInternal(this._kurentoUrl, (error, kurentoClient: Kurento.Client.IKurentoClient) => {
				if (error)
					return reject(error);
				resolve(kurentoClient);
			});
		});
	}
}

export = KurentoClient;