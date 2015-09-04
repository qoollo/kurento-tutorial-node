var Master = (function () {
    function Master(id, streamUrl) {
        this._viewers = [];
        this._pipeline = null;
        this._webRtcEndpoint = null;
        this._id = id;
        this._streamUrl = streamUrl;
    }
    Object.defineProperty(Master.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Master.prototype, "streamUrl", {
        get: function () {
            return this._streamUrl;
        },
        enumerable: true,
        configurable: true
    });
    Master.prototype.addViewer = function (viewer) {
        this._viewers.push(viewer);
        if (this.isOffline)
            this.startStream(); //Not implemented yet. Эта функция должна проставлять pipeline
    };
    ;
    Master.prototype.removeViewer = function (viewer) {
        var index = this._viewers.indexOf(viewer);
        if (index == -1)
            return;
        this._viewers.splice(index, 1);
        if (!this._viewers.length && this.isOnline)
            this.stopStream();
    };
    ;
    Object.defineProperty(Master.prototype, "status", {
        get: function () {
            return !!this._pipeline ? 'online' : 'offline';
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Master.prototype, "isOnline", {
        get: function () {
            return !!this._pipeline;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Master.prototype, "isOffline", {
        get: function () {
            return !this._pipeline;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Master.prototype, "viewers", {
        get: function () {
            return this._viewers;
        },
        enumerable: true,
        configurable: true
    });
    Master.prototype.startStream = function () {
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
                throw new Error('тут не допилен sdp');
                this.webRtcEndpoint.processOffer(sdp, function (error, sdpAnswer) {
                    if (error)
                        return stopProcessWithError('An error occurred while WebRtc endpoint of master №' + this.id + 'trying to process offer'); //???
                    //где-то тут недопил функциональности.
                    //callback(null, sdpAnswer);
                });
            });
        });
    };
    Master.prototype.stopStream = function () {
        throw new Error('Not implemented yet. Эта функция должна проставлять pipeline на null');
    };
    return Master;
})();
//# sourceMappingURL=Master.js.map