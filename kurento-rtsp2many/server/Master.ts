

class Master {

    constructor(id: number, streamUrl: string) {
        this._id = id;
        this._streamUrl = streamUrl;
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
            this.startStream(); //Not implemented yet. Эта функция должна проставлять pipeline
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
    
    startStream() {
        if (this.isOnline) {
            console.log('WARNING! Trying to start an already running stream');
            return;
        }

        function stopProcessWithError(message) {
            console.log('ERROR! ' + message);

            if (pipeline)
                pipeline.release();

            pipeline = null;

            if (this.webRtcEndpoint)
                this.webRtcEndpoint.release();

            this.webRtcEndpoint = null;

            return;
        }

        var kurentoClient = kurentoClientManager.getAvailableClient();
        if (!kurentoClient)
            return stopProcessWithError('Trying to start stream when no one kurento client is exists');

        kurentoClient.client.create('MediaPipeline', function (error, _pipeline) {
            if (error)
                return stopProcessWithError('An error occurred while master №' + this.id + ' trying to create media pieline');

            pipeline = _pipeline;
            pipeline.create('WebRtcEndpoint', function (error, _webRtcEndpoint) {
                if (error)
                    return stopProcessWithError('An error occurred while master №' + this.id + ' trying to create WebRtc endpoint');

                this.webRtcEndpoint = _webRtcEndpoint;

                var sdp = 'WAAAT';
                throw new Error('тут не допилен sdp')
                this.webRtcEndpoint.processOffer(sdp, function (error, sdpAnswer) {
                    if (error)
                        return stopProcessWithError('An error occurred while WebRtc endpoint of master №' + this.id + 'trying to process offer'); //???

                    //где-то тут недопил функциональности.

                    //callback(null, sdpAnswer);
                });
            })
        })
    }

    stopStream() {
        throw new Error('Not implemented yet. Эта функция должна проставлять pipeline на null');
    }
}