

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

    private _pipeline = null;

    private _webRtcEndpoint = null;

    addViewer(viewer) {
        this._viewers.push(viewer);

        if (this.isOffline)
            this.startStream(null); //Not implemented yet. Эта функция должна проставлять pipeline
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

        var kurentoClient = kurentoClientManager.findAvailableClient();
        if (!kurentoClient)
            return this.stopProcessWithError('Trying to start stream when no one kurento client is exists');

        kurentoClient.client.create('MediaPipeline', (error, pipeline) => {
            if (error)
                return this.stopProcessWithError('An error occurred while master №' + this.id + ' trying to create media pieline');
            this.onPipelineCreated(pipeline, callback);
        })
    }

    private onPipelineCreated(pipeline: Kurento.IMediaObject, callback: (err, sdpAnswer) => void) {

        this._pipeline = pipeline;
        this._pipeline.create('WebRtcEndpoint', function (error, _webRtcEndpoint) {
            if (error)
                return this.stopProcessWithError('An error occurred while master №' + this.id + ' trying to create WebRtc endpoint');

            this.webRtcEndpoint = _webRtcEndpoint;

            var sdp = 'WAAAT';
            throw new Error('тут не допилен sdp')
            this.webRtcEndpoint.processOffer(sdp, function (error, sdpAnswer) {
                if (error)
                    return this.stopProcessWithError('An error occurred while WebRtc endpoint of master №' + this.id + 'trying to process offer'); //???

                //где-то тут недопил функциональности.

                callback(null, sdpAnswer);
            });
        });
    }

    private stopProcessWithError(message: string) {
        console.log('ERROR! ' + message);

        if (this._pipeline)
            this._pipeline.release();

        this._pipeline = null;

        if (this._webRtcEndpoint)
            this._webRtcEndpoint.release();

        this._webRtcEndpoint = null;

        return message;
    }

    stopStream() {
        throw new Error('Not implemented yet. Эта функция должна проставлять pipeline на null');
    }
}