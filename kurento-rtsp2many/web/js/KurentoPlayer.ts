
class KurentoPlayer /*extends EventTarget*/ {

    constructor(private _streamUrl: string, private webRtcPeer: Kurento.Utils.IWebRtcPeer) {
        //super();
        this._src = webRtcPeer.remoteVideo.src;
    }
    
    public get src(): string {
        return this._src;
    }
    private _src: string;

    public get streamUrl(): string {
        return this._streamUrl;
    }

    public play(): Promise<any> {
        return Promise.reject('Not implemented');
    }

    public stop(): Promise<any> {
        return Promise.reject('Not implemented');
    }
}

export = KurentoPlayer;