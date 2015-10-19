
class KurentoPlayer /*extends EventTarget*/ {

    constructor(streamUrl: string, public src: string) {
        //super();
        this._streamUrl = streamUrl;
    }

    public get streamUrl(): string {
        return this._streamUrl;
    }
    private _streamUrl: string;

    public play(): Promise<any> {
        return Promise.reject('Not implemented');
    }

    public stop(): Promise<any> {
        return Promise.reject('Not implemented');
    }
}

export = KurentoPlayer;