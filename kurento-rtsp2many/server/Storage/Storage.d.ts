
declare module Storage {
	
	interface IVideoConsumer extends Protocol.IClientId {
		registerTime: Date;
		streamConnections: IStreamConnection[];
	}
	
	interface IStreamConnection {
		streamUrl: string;
		kurentoServer_id: string;
		connectTime: Date;
	}
	
	interface IKurentoServer {
		_id: string;
		url: string;
	}
}
