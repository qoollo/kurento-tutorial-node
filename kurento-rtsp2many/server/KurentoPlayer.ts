
import KurentoClient = require('./KurentoClient');

/**
 * Represents player that is playing stream inside remote Kurento Media Server
 */
class KurentoPlayer {
	
	/**
	 * @param {KurentoClient} _kurentoClient 
	 * 	KurentoClient for remote Kurento Media Server
	 */
	constructor(private _kurentoClient: KurentoClient) {		
	}
	
	public get kurentoClient(): KurentoClient {
		return this._kurentoClient;
	}
}

export = KurentoPlayer;