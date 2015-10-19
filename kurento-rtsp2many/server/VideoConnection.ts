
class VideoConnection {
	
	constructor(
		private _streamUrl: string,
		private _client: Storage.IVideoConsumer) {
		
	}
	
	public get streamUrl(): string {
		return this._streamUrl;
	}
	
	public get client(): Storage.IVideoConsumer {
		return this._client;
	}
}

export = VideoConnection;