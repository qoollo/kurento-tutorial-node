var Master = (function () {
    function Master(id, streamUrl, pipeline) {
        this._viewers = [];
        this._pipeline /* : Kurento.IMediaObject*/ = null;
        this._webRtcEndpoint = null;
        this._webRtcPeer = null;
        this._id = id;
        this._streamUrl = streamUrl;
        this._pipeline = pipeline;
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
            this.startStream(null);
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
    Master.prototype.startStream = function (callback) {
        var _this = this;
        if (this.isOnline) {
            console.warn('WARNING! Trying to start an already running stream');
            return;
        }
        //TODO: add more validation for every step! 
        //TODO in future: use promise.
        var onOffer = function (sdpOffer) {
            var kurentoClient = kurentoClientManager.findAvailableClient();
            if (!kurentoClient)
                return _this.stopStartStreamProcessWithError('Trying to start stream when no one kurento client is exists');
            kurentoClient.client.create('MediaPipeline', function (error, pipeline) {
                if (error)
                    return _this.stopStartStreamProcessWithError('An error occurred while master №' + _this.id + ' trying to create media pieline', error);
                _this._pipeline = pipeline;
                _this._pipeline.create("PlayerEndpoint", { uri: _this._streamUrl }, function (error, player) {
                    if (error)
                        return this.stopProcessWithError('An error occurred while master №' + this.id + ' trying to create endpoint player', error);
                    this._pipeline.create('WebRtcEndpoint', function (error, _webRtcEndpoint) {
                        if (error)
                            return this.stopProcessWithError('An error occurred while master №' + this.id + ' trying to create WebRtc endpoint', error);
                        this.webRtcEndpoint = _webRtcEndpoint;
                        this.webRtcEndpoint.processOffer(sdpOffer, function (error, sdpAnswer) {
                            if (error)
                                return this.stopProcessWithError('An error occurred while WebRtc endpoint of master №' + this.id + 'trying to process offer', error);
                            this._webRtcPeer.processSdpAnswer(sdpAnswer);
                            callback(null, sdpAnswer);
                        });
                    });
                });
            });
        };
        this._webRtcPeer = kurentoUtils.WebRtcPeer.startRecvOnly({}, onOffer, function (error) { _this.stopStartStreamProcessWithError('An error occurred while master №' + _this.id + ' trying to create WebRTC peer', error); }, null, null, null);
    };
    Master.prototype.stopStartStreamProcessWithError = function (message, error) {
        if (error === void 0) { error = null; }
        console.log('ERROR! ' + message, error || '');
        this.disposeMasterMediaObjects();
        return message;
    };
    Master.prototype.stopStream = function () {
        throw new Error('Not implemented yet. Эта функция должна проставлять pipeline на null');
        //закрыть вьюверы тут
        this.disposeMasterMediaObjects();
    };
    Master.prototype.disposeMasterMediaObjects = function () {
        if (this._webRtcPeer)
            this._webRtcPeer.dispose();
        this._webRtcPeer = null;
        if (this._pipeline)
            this._pipeline.release();
        this._pipeline = null;
        if (this._webRtcEndpoint)
            this._webRtcEndpoint.release();
        this._webRtcEndpoint = null;
    };
    return Master;
})();
//# sourceMappingURL=Master.js.map