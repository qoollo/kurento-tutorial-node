
declare module Storage {
	
	interface IVideoConsumer extends Protocol.IClientId {
		registerTime: Date;
		streamConnections: IStreamConnection[];
	}
	
	interface IStreamConnection {
		streamUrl: string;
		connectTime: Date;
	}
	
	interface IKurentoServer {
		url: string;
	}
}
