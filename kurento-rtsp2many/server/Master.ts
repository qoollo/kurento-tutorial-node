﻿

class Master {

    constructor(id: number, streamUrl: string, pipeline: Kurento.IMediaPipeline) {
        this._id = id;
        this._streamUrl = streamUrl;
        this._pipeline = pipeline;
    }

    get id(): number {
        return this._id;
    }
    private _id: number;

    get streamUrl(): string {
        return this._streamUrl;
    }
    private _streamUrl: string;

    _viewers: Object[] = [];

    private _pipeline /* : Kurento.IMediaObject*/ = null;

    private _webRtcEndpoint = null;

    private _webRtcPeer = null;

    addViewer(viewer) {
        this._viewers.push(viewer);

        if (this.isOffline)
            this.startStream(null);
    };

    removeViewer(viewer) {
        var index = this._viewers.indexOf(viewer);
        if (index == -1)
            return;

        this._viewers.splice(index, 1);

        if (!this._viewers.length && this.isOnline)
            this.stopStream();
    };

    get status(): string {
        return !!this._pipeline ? 'online' : 'offline';
    }

    get isOnline(): boolean {
        return !!this._pipeline;
    }

    get isOffline(): boolean {
        return !this._pipeline;
    }

    get viewers(): Object[]{
        return this._viewers;
    }
    
    startStream(callback: (err, sdpAnswer) => void) {
        if (this.isOnline) {
            console.warn('WARNING! Trying to start an already running stream');
            return;
        }


        //TODO: add more validation for every step! 
        //TODO in future: use promise.
        var onOffer = (sdpOffer: string) => {
            var kurentoClient = kurentoClientManager.findAvailableClient();

            if (!kurentoClient) return this.stopStartStreamProcessWithError('Trying to start stream when no one kurento client is exists');

            kurentoClient.client.create('MediaPipeline', (error, pipeline) => {
                if (error) return this.stopStartStreamProcessWithError('An error occurred while master №' + this.id + ' trying to create media pieline', error);

                this._pipeline = pipeline;

                this._pipeline.create("PlayerEndpoint", { uri: this._streamUrl }, function (error, player) {
                    if (error) return this.stopProcessWithError('An error occurred while master №' + this.id + ' trying to create endpoint player', error);

                    this._pipeline.create('WebRtcEndpoint', function (error, _webRtcEndpoint) {
                        if (error) return this.stopProcessWithError('An error occurred while master №' + this.id + ' trying to create WebRtc endpoint', error);

                        this.webRtcEndpoint = _webRtcEndpoint;

                        this.webRtcEndpoint.processOffer(sdpOffer, function (error, sdpAnswer) {
                            if (error) return this.stopProcessWithError('An error occurred while WebRtc endpoint of master №' + this.id + 'trying to process offer', error); 

                            this._webRtcPeer.processSdpAnswer(sdpAnswer);
                            callback(null, sdpAnswer);
                        });
                    });
                })
            })
        }

        this._webRtcPeer = kurentoUtils.WebRtcPeer.startRecvOnly(
            <HTMLVideoElement>{},
            onOffer,
            (error) => { this.stopStartStreamProcessWithError('An error occurred while master №' + this.id + ' trying to create WebRTC peer', error) },
            null, null, null);
    }

    private stopStartStreamProcessWithError(message: string, error: any = null) {
        console.log('ERROR! ' + message, error || '');

        this.disposeMasterMediaObjects();

        return message;
    }

    stopStream() {

        throw new Error('Not implemented yet. Эта функция должна проставлять pipeline на null');

        //закрыть вьюверы тут

        this.disposeMasterMediaObjects();
    }

    disposeMasterMediaObjects() {
        if (this._webRtcPeer)
            this._webRtcPeer.dispose();

        this._webRtcPeer = null;

        if (this._pipeline)
            this._pipeline.release();

        this._pipeline = null;

        if (this._webRtcEndpoint)
            this._webRtcEndpoint.release();

        this._webRtcEndpoint = null;
    }
}