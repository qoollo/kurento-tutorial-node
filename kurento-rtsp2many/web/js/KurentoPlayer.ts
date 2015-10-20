
class KurentoPlayer /*extends EventTarget*/ {

    constructor(private _streamUrl: string, private webRtcPeer: Kurento.Utils.IWebRtcPeer) {
        //super();
        this._src = webRtcPeer.remoteVideo.src;
        this.webRtcPeer.onerror = err => this.raiseEvent(KurentoPlayer.events.error, err)
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
    
    public dispose(): Promise<any> {
        return Promise.resolve(this.webRtcPeer.dispose());
    }
    
    private raiseEvent(errorType: { name: string, listeners: any[] }, ev): void {
        errorType.listeners.forEach(l => l(ev));
    }
    
    public addEventListener(eventName: string, listener: (ev) => void): void {
        if (eventName in KurentoPlayer.events)
            KurentoPlayer.events[eventName].listeners.push(listener);
        else
            throw new Error('KurentoPlayer does not support event ' + eventName);
    }
    
    public removeEventListener(eventName: string, listener: (ev) => void): void {
        if (eventName in KurentoPlayer.events)
            KurentoPlayer.events[eventName].listeners.splice(KurentoPlayer.events[eventName].listeners.indexOf(listener), 1);
        else
            throw new Error('KurentoPlayer does not support event ' + eventName);
    }
    
    public static events = {
        error: {
            name: 'error',
            listeners: []
        }
    }
}

export = KurentoPlayer;