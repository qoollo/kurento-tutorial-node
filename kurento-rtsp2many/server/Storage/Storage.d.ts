
declare module Storage {
	
	interface IVideoConsumer extends Protocol.IClientId {
		registerTime: Date;
		streamConnections: IStreamConnection[];
	}
	
	interface IStreamConnection {
		streamUrl: string;
		kurentoServerId: string;
		connectTime: Date;
	}
	
	interface IKurentoServer {
		__id: string;
		url: string;
	}
}
