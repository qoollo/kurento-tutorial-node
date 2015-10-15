/// <reference path="../typings/kurento-client.d.ts" />
/// <reference path="../typings/kurento-utils.d.ts" />
/// <reference path="./Viewer.ts" />
/// <reference path="./KurentoClientManager.ts" />
var Master = (function () {
    function Master(id, streamUrl, pipeline, kurentoClientManager) {
        this.kurentoClientManager = kurentoClientManager;
        this._viewers = [];
        this._pipeline = null;
        this._player = null;
        this.playerCreationStarted = false;
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
        this.playerCreationStarted = true;
        this.kurentoClientManager.findOrCreateClient(function (err, kurentoClient) {
            if (err) {
                return _this.stopStartStreamProcessWithError('Failed to find or create KurentoClient.', err);
            }
            kurentoClient.client.create('MediaPipeline', function (err, p) {
                if (err) {
                    return callback('An error occurred while master #' + _this.id + ' trying to create media pieline' + err.toString());
                }
                console.log('MediaPipeline created for Master #', _this.id);
                _this._pipeline = p;
                _this._pipeline.create("PlayerEndpoint", { uri: _this._streamUrl }, function (err, player) {
                    if (err) {
                        return callback('An error occurred while master #' + _this.id + ' trying to create endpoint player. ' + err.toString());
                    }
                    console.log('PlayerEndpoint created for Master #', _this.id, '. Stream URL:', _this._streamUrl);
                    _this._player = player;
                    callback(null, player);
                });
            });
        });
    };
    Master.prototype.addViewer = function (viewer, callback) {
        var _this = this;
        if (this._viewers.some(function (v) { return v.sessionId == viewer.sessionId; })) {
            console.warn("Viewer #", viewer.sessionId, " is already added to Master #", this.id);
            return;
        }
        this._viewers.push(viewer);
        if (this._player) {
            console.log('PlayerEndpoint already created. Reusing existing one...');
            this.addViewerToPlayer(this._player, viewer, callback);
        }
        else {
            console.log('Creating PlayerEndpoint...');
            this.startStream(function (err, player) {
                if (err)
                    return console.error('Failed to Add Viewer because of failure during startStream.');
                _this.addViewerToPlayer(player, viewer, callback);
            });
        }
    };
    Master.prototype.addViewerToPlayer = function (player, viewer, callback) {
        var _this = this;
        this._pipeline.create('WebRtcEndpoint', function (err, webRtcEndpoint) {
            if (err)
                return callback('An error occurred while master #' + _this.id + ' trying to create WebRtc endpoint' + err.toString());
            console.log('WebRtcEndpoint created for Master #', _this.id);
            _this._webRtcEndpoint = webRtcEndpoint;
            var finalSdpAnswer = null, playerPlaying = false;
            _this._webRtcEndpoint.processOffer(viewer.sdpOffer, function (err, sdpAnswer) {
                if (err)
                    return callback('An error occurred while WebRtc endpoint of master #' + _this.id + 'trying to process offer' + err.toString());
                console.log('SdpOffer processed for Master #', _this.id, ' SdpOffer:', viewer.sdpOffer, '. SdpAnswer:', sdpAnswer);
                finalSdpAnswer = sdpAnswer;
                if (playerPlaying)
                    callback(null, finalSdpAnswer);
            });
            _this._pipeline.create('GStreamerFilter', { command: 'capsfilter caps=video/x-raw,framerate=25/1', filterType: "VIDEO" }, function (err, gstFilter) {
                if (err)
                    return console.error("Failed to create GStreamerFilter.", err);
                console.log("Successfully created GStreamerFilter.", err);
                player.connect(gstFilter, function (err) {
                    if (err)
                        return console.error("Failed to connect PLayerEndpoint to GStreamerFilter.", err);
                    console.log("Successfully connected PLayerEndpoint to GStreamerFilter.", err);
                    gstFilter.connect(_this._webRtcEndpoint, function (err) {
                        if (err)
                            return console.error("Failed to connect GStreamerFilter to WebRtcEndpoint", err);
                        console.log("Successfully connected GStreamerFilter to WebRtcEndpoint.", err);
                        player.play(function (err) {
                            if (err)
                                return console.error('Failed to start playing.');
                            console.log('Successfully started playing by PlayerEndpoint');
                            playerPlaying = true;
                            if (finalSdpAnswer)
                                callback(null, finalSdpAnswer);
                        });
                    });
                });
            });
        });
    };
    Master.prototype.stopStartStreamProcessWithError = function (message, error) {
        if (error === void 0) { error = null; }
        console.error('ERROR! ' + message, error || '');
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
module.exports = Master;

//# sourceMappingURL=Master.js.map
