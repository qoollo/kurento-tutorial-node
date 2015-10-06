/// <reference path="../typings/kurento-client.d.ts" />
/// <reference path="../typings/kurento-utils.d.ts" />
/// <reference path="./Viewer.ts" />

class Master {

    constructor(id: string, streamUrl: string, pipeline: Kurento.Client.IMediaPipeline, private kurentoClientManager: KurentoClientManager) {
        this._id = id;
        this._streamUrl = streamUrl;
        this._pipeline = pipeline;
    }

    get id(): string {
        return this._id;
    }
    private _id: string;

    get streamUrl(): string {
        return this._streamUrl;
    }
    private _streamUrl: string;

    _viewers: Viewer[] = [];

    private _pipeline: Kurento.Client.IMediaPipeline = null;

    private _player: Kurento.Client.IPlayerEndpoint = null;
    private playerCreationStarted: boolean = false;

    private _webRtcEndpoint: Kurento.Client.IWebRtcEndpoint = null;

    private _webRtcPeer = null;

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

    get viewers(): Object[] {
        return this._viewers;
    }

    startStream(callback: (err, player?: Kurento.Client.IPlayerEndpoint) => void) {
        if (this.isOnline) {
            console.warn('WARNING! Trying to start an already running stream');
            return;
        }
        this.playerCreationStarted = true;

        this.kurentoClientManager.findOrCreateClient((err, kurentoClient) => {
            if (err) {
                return this.stopStartStreamProcessWithError('Failed to find or create KurentoClient.', err);
            }

            kurentoClient.client.create('MediaPipeline', (err, p) => {
                if (err) {
                    return callback('An error occurred while master #' + this.id + ' trying to create media pieline' + err.toString());
                }

                console.log('MediaPipeline created for Master #', this.id);
                this._pipeline = p;

                this._pipeline.create("PlayerEndpoint", { uri: this._streamUrl }, (err, player: Kurento.Client.IPlayerEndpoint) => {
                    if (err) {
                        return callback('An error occurred while master #' + this.id + ' trying to create endpoint player. ' + err.toString());
                    }

                    console.log('PlayerEndpoint created for Master #', this.id, '. Stream URL:', this._streamUrl);

                    this._player = player;
                    callback(null, player);
                })
            });
        });

        
        

        //TODO: add more validation for every step! 
        //TODO in future: use promise.
        //var onOffer = (sdpOffer: string) => {
        //    var kurentoClient = this.kurentoClientManager.findAvailableClient();

        //    if (!kurentoClient)
        //        return this.stopStartStreamProcessWithError('Trying to start stream when no one kurento client is exists');

        //    kurentoClient.client.create('MediaPipeline', (err, p) => {
        //        if (err)
        //            return callback('An error occurred while master #' + this.id + ' trying to create media pieline' + err.toString());

        //        console.log('MediaPipeline created for Master #', this.id);
        //        this._pipeline = p;

        //        this._pipeline.create("PlayerEndpoint", { uri: this._streamUrl }, (err, player) => {
        //            if (err)
        //                return callback('An error occurred while master #' + this.id + ' trying to create endpoint player. ' + err.toString());

        //            console.log('PlayerEndpoint created for Master #', this.id, '. Stream URL:', this._streamUrl);
        //        })
        //    })
        //}

        //this._webRtcPeer = kurentoUtils.WebRtcPeer.startRecvOnly(
        //    <HTMLVideoElement>{},
        //    onOffer,
        //    (error) => { this.stopStartStreamProcessWithError('An error occurred while master №' + this.id + ' trying to create WebRTC peer', error) },
        //    null, null, null);
    }

    public addViewer(viewer: Viewer, callback: (err, sdpAnswer?: string) => void): void {
        if (this._viewers.some(v => v.sessionId == viewer.sessionId)) {
            console.warn("Viewer #", viewer.sessionId, " is already added to Master #", this.id);
            return
        }

        this._viewers.push(viewer);

        if (this._player) {
            console.log('PlayerEndpoint already created. Reusing existing one...');
            this.addViewerToPlayer(this._player, viewer, callback);
        } else {
            console.log('Creating PlayerEndpoint...');
            this.startStream((err, player) => {
                if (err)
                    return console.error('Failed to Add Viewer because of failure during startStream.');
                this.addViewerToPlayer(player, viewer, callback);
            });
        }
    }

    private addViewerToPlayer(player: Kurento.Client.IPlayerEndpoint, viewer: Viewer, callback: (err, sdpAnswer?: string) => void): void {
        this._pipeline.create('WebRtcEndpoint', (err, webRtcEndpoint) => {
            if (err)
                return callback('An error occurred while master #' + this.id + ' trying to create WebRtc endpoint' + err.toString());

            console.log('WebRtcEndpoint created for Master #', this.id);
            this._webRtcEndpoint = webRtcEndpoint;

            var finalSdpAnswer = null,
                playerPlaying = false;

            this._webRtcEndpoint.processOffer(viewer.sdpOffer, (err, sdpAnswer) => {
                if (err)
                    return callback('An error occurred while WebRtc endpoint of master #' + this.id + 'trying to process offer' + err.toString());

                console.log('SdpOffer processed for Master #', this.id, ' SdpOffer:', viewer.sdpOffer, '. SdpAnswer:', sdpAnswer);
                finalSdpAnswer = sdpAnswer;
                if (playerPlaying)
                    callback(null, finalSdpAnswer);
            });

            this._pipeline.create('GStreamerFilter', { command: 'capsfilter caps=video/x-raw,framerate=25/1', filterType: "VIDEO" }, (err, gstFilter) => {
                if (err)
                    return console.error("Failed to create GStreamerFilter.", err);

                console.log("Successfully created GStreamerFilter.", err);
                player.connect(gstFilter, err => {
                    if (err)
                        return console.error("Failed to connect PLayerEndpoint to GStreamerFilter.", err);

                    console.log("Successfully connected PLayerEndpoint to GStreamerFilter.", err);
                    gstFilter.connect(this._webRtcEndpoint, err => {
                        if (err)
                            return console.error("Failed to connect GStreamerFilter to WebRtcEndpoint", err);

                        console.log("Successfully connected GStreamerFilter to WebRtcEndpoint.", err);
                        player.play(err => {
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
    }

    private stopStartStreamProcessWithError(message: string, error: any = null) {
        console.error('ERROR! ' + message, error || '');

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