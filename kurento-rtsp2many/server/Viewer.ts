
class Viewer {

    constructor(sessionId: number, streamUrl: string, sdpOffer: string) {
        this._sessionId = sessionId;
        this._streamUrl = streamUrl;
        this._sdpOffer = sdpOffer;
    }

    public get sessionId(): number {
        return this._sessionId;
    }
    private _sessionId: number;

    public get streamUrl(): string {
        return this._streamUrl;
    }
    private _streamUrl: string;

    public get sdpOffer(): string {
        return this._sdpOffer;
    }
    private _sdpOffer: string
}