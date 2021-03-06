/// <reference path="../typings/es6-promise.d.ts" />
/// <reference path="../typings/kurento-client.d.ts" />
/// <reference path="../typings/kurento-utils.d.ts" />
/// <reference path="./Url.ts" />
/// <reference path="./ILogger.ts" />
/// <reference path="./Disposable.ts" />
/// <reference path="./StreamingSettings.ts" />
/// <reference path="./RtspPlayerState.ts" />

module CitySoft {

    class PlayerToWebRtcBundle extends Disposable {

        constructor(
            private _playerEndpoint: Kurento.Client.IPlayerEndpoint,
            private _webRtcEndpoint: Kurento.Client.IWebRtcEndpoint,
            ...filters: Kurento.Client.IFilter[]) {
            super();
            this._filters = filters;
        }

        get playerEndpoint(): Kurento.Client.IPlayerEndpoint {
            return this._playerEndpoint;
        }
        get webRtcEndpoint(): Kurento.Client.IWebRtcEndpoint {
            return this._webRtcEndpoint;
        }
        get filters(): Kurento.Client.IFilter[] {
            return this._filters;
        }
        private _filters: Kurento.Client.IFilter[];

        dispose(): void {
            super.dispose();
            this.filters.forEach(f => f.release());
            if (this.playerEndpoint)
                this.playerEndpoint.release();
            if (this.webRtcEndpoint)
                this.webRtcEndpoint.release();
        }
    }

    class StreamingContext extends Disposable {

        constructor(
            public webRtcPeer: Kurento.Utils.IWebRtcPeer = null,
            public pipeline: Kurento.Client.IMediaPipeline = null,
            public src: string = null) {
            super();
        }

        public mediaObjectsBundle: PlayerToWebRtcBundle = null;

        public stop(): void {
            if (this.mediaObjectsBundle) {
                this.mediaObjectsBundle.playerEndpoint.stop();
            }
        }

        public dispose(): void {
            super.dispose();
            this.mediaObjectsBundle.dispose();
            if (this.pipeline)
                this.pipeline.release();
            if (this.webRtcPeer)
                this.webRtcPeer.dispose();
        }

        public createRtspPlayer(): RtspPlayer {
            return new RtspPlayer(this);
        }

        private _stop(): void {
            if (this.webRtcPeer) {
                this.webRtcPeer.dispose();
                this.webRtcPeer = null;
            }
            if (this.pipeline) {
                this.pipeline.release();
                this.pipeline = null;
            }
            if (this.src) {
                this.src = null;
            }
        }
    }

    export class RtspPlayer extends Disposable {

        constructor(private streamingCcontext: StreamingContext) {
            super();
            this._state = RtspPlayerState.Playing;
        }

        play(): Promise<void> {
            if (this._state != RtspPlayerState.Playing)
                this.setState(RtspPlayerState.TransitionToPlay);
            return this.streamingCcontext.mediaObjectsBundle.playerEndpoint.play()
                .then(() => this.setState(RtspPlayerState.Playing));
        }

        pause(): Promise<void> {
            if (this._state != RtspPlayerState.Paused)
                this.setState(RtspPlayerState.TransitionToPause);
            return this.streamingCcontext.mediaObjectsBundle.playerEndpoint.pause()
                .then(() => this.setState(RtspPlayerState.Paused));
        }

        stop(): Promise<void> {
            if (this._state != RtspPlayerState.Stopped)
                this.setState(RtspPlayerState.TransitionToStop);
            return this.streamingCcontext.mediaObjectsBundle.playerEndpoint.stop()
                .then(() => this.setState(RtspPlayerState.Stopped));
        }

        get src(): string {
            return this.streamingCcontext.src;
        }

        public get state(): RtspPlayerState {
            return this._state;
        }
        private setState(value: RtspPlayerState): void {
            if (this._state != value) {
                var prev = this._state;
                this._state = value;
                this.stateChangeListeners.forEach(l => l(value, prev, this));
            }
        }
        private _state: RtspPlayerState;

        public addStateChangedListener(listener: IStateChangeListener): void {
            this.stateChangeListeners.push(listener);
        }
        public removeStateChangedListener(listener: IStateChangeListener): void {
            this.stateChangeListeners.splice(this.stateChangeListeners.indexOf(listener), 1);
        }
        private stateChangeListeners: IStateChangeListener[] = [];

        dispose(): void {
            super.dispose();
            this.setState(RtspPlayerState.Disposed);
            this.streamingCcontext.dispose();
        }
    }

    export interface IStateChangeListener {
        (newState: RtspPlayerState, prevState: RtspPlayerState, sender: RtspPlayer): void;
    }

    class KurentoClientError {

        constructor(public message, public data) {
            this.message = message;
            this.data = data;
        }
    }

    class WebRtcPeerWrapper {
        constructor(public webRtcPeer: Kurento.Utils.IWebRtcPeer) {
        }

        sdpOffer: string = null;
    }

    class KurentoPipeline {

        constructor(private logger: ILogger) {
        }

        private kurentoClients: KurentoClientWrapper[] = [];

        public createRtspPlayer(streamingSettings: StreamingSettings, videoElement: HTMLVideoElement): Promise<RtspPlayer> {
            return this.getKurentoClient(streamingSettings.kurentoWsUri)
                .then(client => client.createRtspPlayer(streamingSettings, videoElement));
        }

        private getKurentoClient(kurentoWsUrl: string): Promise<KurentoClientWrapper> {
            var match = this.kurentoClients.filter(c => c.kurentoWsUrl == kurentoWsUrl)[0];
            if (!match) {
                var videoElement = {};
                return new Promise((resolve, reject) => {
                    var webRtcPeer = kurentoUtils.WebRtcPeer.startRecvOnly(<any>videoElement, (sdpOffer) => {
                        new kurentoClient(kurentoWsUrl, (error, kurentoClient) => {
                            if (error)
                                return reject(error);
                            var client = new KurentoClientWrapper(this.logger, kurentoClient, kurentoWsUrl, webRtcPeer, sdpOffer, <any>videoElement);
                            this.kurentoClients.push(client);
                            resolve(client);
                        });
                    });
                });
            }
            else
                return Promise.resolve(match);
        }
    }

    class KurentoClientWrapper {
        constructor(
            private logger: ILogger,
            private _kurentoClient: Kurento.Client.IKurentoClient,
            private _kurentoWsUrl: string,
            private webRtcPeer: Kurento.Utils.IWebRtcPeer,
            private sdpOffer: string,
            private videoElement: HTMLVideoElement) {
        }

        private sdpOfferProcessed: boolean = false;

        public get kurentoClient(): Kurento.Client.IKurentoClient {
            return this._kurentoClient;
        }

        public get kurentoWsUrl(): string {
            return this._kurentoWsUrl;
        }

        private getPipeline(): Promise<Kurento.Client.IMediaPipeline> {
            if (this._pipeline == null) {
                this._pipeline = new Promise((resolve, reject) => {
                    this.kurentoClient.create("MediaPipeline", (error, p) => {
                        if (error)
                            return reject(error);
                        resolve(p);
                    });
                });
            }
            return this._pipeline;
        }
        private _pipeline: Promise<Kurento.Client.IMediaPipeline> = null;

        public createRtspPlayer(streamingSettings: StreamingSettings, videoElement: HTMLVideoElement): Promise<RtspPlayer> {
            return this.getPipeline()
                .then(pipeline => this.createRtspPlayerInPipeline(streamingSettings, videoElement, pipeline));
        }

        private createRtspPlayerInPipeline(streamingSettings: StreamingSettings, videoElement: HTMLVideoElement, pipeline: Kurento.Client.IMediaPipeline): Promise<RtspPlayer> {
            return new Promise((resolve, reject) => {
                pipeline.create("PlayerEndpoint", { uri: streamingSettings.rtspUrl }, (error, player) => {
                    if (error) return reject(error);

                    pipeline.create("WebRtcEndpoint", (error, webRtc) => {
                        if (error) return reject(error);

                        if (!this.sdpOfferProcessed) {
                            this.sdpOfferProcessed = true;
                            webRtc.processOffer(this.sdpOffer, (error, sdpAnswer) => {
                                if (error) return reject(error);

                                this.webRtcPeer.processSdpAnswer(sdpAnswer);
                            });
                        }

                        pipeline.create('GStreamerFilter', { command: 'capsfilter caps=video/x-raw,framerate=25/1', filterType: "VIDEO" }, (error, gstFilter) => {
                            if (error) return reject(error);

                            player.connect(gstFilter, error => {
                                if (error) return reject(error);

                                gstFilter.connect(webRtc, error => {
                                    if (error) return reject(error);

                                    this.logger.log("PlayerEndpoint-->WebRtcEndpoint connection established.");

                                    player.play(error => {
                                        if (error) return reject(error);

                                        this.logger.log("Player playing...");
                                        var context = new StreamingContext(this.webRtcPeer, pipeline, videoElement.src);
                                        context.mediaObjectsBundle = new PlayerToWebRtcBundle(player, webRtc, gstFilter);
                                        var rtspPlayer = context.createRtspPlayer();
                                        resolve(rtspPlayer);
                                    });
                                });
                            });
                        });

                    });
                });
            });
        }

    }

    export class RtspStreamingManager {

        constructor(logger: ILogger = console) {
            this.logger = logger;
            window.addEventListener('unload', () => this.dispose());
        }

        private logger: ILogger;

        private webRtcPeer: WebRtcPeerWrapper = null;
        private kurentoClient: Kurento.Client.IKurentoClient = null;
        private createdPipelines: Kurento.Client.IMediaPipeline[] = [];
        private createdPlayers: RtspPlayer[] = [];

        dispose(): void {
            this.disposed = true;
            this.createdPipelines.forEach(p => p.release());
            this.createdPlayers.forEach(p => p.dispose());
        }
        private disposed: boolean = false;

        private checkDisposed(): void {
            if (this.disposed)
                throw new Error('RtspStreamingManager is disposed.');
        }

        startStreamingWithReusing(streamingSettings: StreamingSettings, videoElement: HTMLVideoElement): Promise<RtspPlayer> {
            return this.kurentoPipeline.createRtspPlayer(streamingSettings, videoElement)
                .then(player => {
                    this.createdPlayers.push(player);
                    return player;
                });
        }
        private kurentoPipeline: KurentoPipeline = new KurentoPipeline(this.logger);

        startStreaming(streamingSettings: StreamingSettings, videoElement: HTMLVideoElement): Promise<RtspPlayer> {
            var resolve,
                reject,
                promise = new Promise((res, rej) => { resolve = res; reject = rej; }),
                onError = err => reject(err),
                pipeline: Kurento.Client.IMediaPipeline,
                webRtcPeer = kurentoUtils.WebRtcPeer.startRecvOnly(videoElement, (sdpOffer) => {
                    new kurentoClient(streamingSettings.kurentoWsUri, (error, kurentoClient) => {
                        if (error) return reject(error);

                        kurentoClient.create("MediaPipeline", (error, p) => {
                            if (error) return reject(error);

                            pipeline = p;

                            pipeline.create("PlayerEndpoint", { uri: streamingSettings.rtspUrl }, (error, player) => {
                                if (error) return reject(error);

                                pipeline.create("WebRtcEndpoint", (error, webRtc) => {
                                    if (error) return reject(error);

                                    webRtc.processOffer(sdpOffer, (error, sdpAnswer) => {
                                        if (error) return reject(error);

                                        webRtcPeer.processSdpAnswer(sdpAnswer);
                                    });

                                    pipeline.create('GStreamerFilter', { command: 'capsfilter caps=video/x-raw,framerate=25/1', filterType: "VIDEO" }, (error, gstFilter) => {
                                        if (error) return reject(error);

                                        player.connect(gstFilter, error => {
                                            if (error) return reject(error);

                                            gstFilter.connect(webRtc, error => {
                                                if (error) return reject(error);

                                                this.logger.log("PlayerEndpoint-->WebRtcEndpoint connection established.");

                                                player.play(error => {
                                                    if (error) return reject(error);

                                                    this.logger.log("Player playing...");
                                                    var context = new StreamingContext(webRtcPeer, pipeline, videoElement.src);
                                                    context.mediaObjectsBundle = new PlayerToWebRtcBundle(player, webRtc, gstFilter);
                                                    var rtspPlayer = context.createRtspPlayer();
                                                    this.createdPlayers.push(rtspPlayer);
                                                    resolve(rtspPlayer);
                                                });
                                            });
                                        });
                                    });

                                });
                            });
                        });
                    });
                }, error => reject(error));

            return promise;
        }

        startStreamingOld(streamingSettings: StreamingSettings, videoElement: HTMLVideoElement): Promise<RtspPlayer> {
            this.checkDisposed();
            if (!(streamingSettings instanceof StreamingSettings)
                || !streamingSettings.kurentoWsUri
                || !streamingSettings.rtspUrl)
                throw new KurentoClientError('Incorrect streaming settings', streamingSettings);

            return new Promise((resolve, reject) => {

                var responseData = new StreamingContext();

                this.createWebRtcPeerAndGetSdpOffer(videoElement, responseData)
                    .then(sdpOffer => this.processSdpOfferAndPlay(sdpOffer, streamingSettings, responseData))
                    .then(() => { responseData.src = videoElement.src; resolve(responseData.createRtspPlayer()); },
                        error => {
                            responseData.stop();
                            reject(error);
                        })

            })
        }

        private createWebRtcPeerAndGetSdpOffer(videoElement: HTMLVideoElement, responseData: StreamingContext): Promise<string> {
            if (this.webRtcPeer) {
                this.logger.debug('WebRtcPeer already created before. Reusing the same one.');
                responseData.webRtcPeer = this.webRtcPeer.webRtcPeer;
                return Promise.resolve(this.webRtcPeer.sdpOffer);
            }
            this.logger.debug('Creating WebRtcPeer and getting SDP Offer...');
            return new Promise((resolve, reject) => {
                responseData.webRtcPeer = kurentoUtils.WebRtcPeer.startRecvOnly(
                    videoElement,
                    sdpOffer => {
                        this.logger.debug('Received SDP Offer.');
                        this.webRtcPeer.sdpOffer = sdpOffer;
                        resolve(sdpOffer);
                    },
                    err => {
                        this.logger.error('Error in WebRtcPeer.', err);
                        reject(err);
                    });
                this.webRtcPeer = new WebRtcPeerWrapper(responseData.webRtcPeer);
                this.logger.debug('WebRtcPeer created successfully...I guess.');
            });
        }

        private processSdpOfferAndPlay(sdpOffer: string, streamingSettings: StreamingSettings, responseData: StreamingContext): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                this.createKurentoClientCb(streamingSettings, (err, kurentoClient) => {
                    if (err)
                        reject(err);

                    this.kurentoClient = kurentoClient;
                    this.createMediaPipelineCb(kurentoClient, (err, mediaPipeline) => {
                        responseData.pipeline = mediaPipeline;
                        this.createPlayerToWebRtcBundle(mediaPipeline, streamingSettings.rtspUrl)
                            .then(bundle => {
                                responseData.mediaObjectsBundle = bundle;
                                return Promise.all([
                                    bundle.playerEndpoint.play(),
                                    bundle.webRtcEndpoint.processOffer(sdpOffer).then(sdpAnswer =>
                                        responseData.webRtcPeer.processSdpAnswer(sdpAnswer))]);
                            })
                            .then(<any>resolve, reject);
                    });
                });
            });
        }

        private createKurentoClientCb(streamingSettings: StreamingSettings, callback: (error: any, result: Kurento.Client.IKurentoClient) => void): void {
            if (this.kurentoClient) {
                this.logger.debug('KurentoClient already created. Reusing existing one.');
                return callback(null, this.kurentoClient);
            }
            this.logger.debug('Creating KurentoClient...');
            new kurentoClient(streamingSettings.kurentoWsUri, (error, kurentoClient) => {
                if (error)
                    return this.logger.error('Failed to create KurentoClient.');

                this.logger.debug('KurentoClient created successfully.');

                callback(null, kurentoClient);
            });
        }

        private createKurentoClient(streamingSettings: StreamingSettings): Promise<Kurento.Client.IKurentoClient> {
            this.logger.debug('Creating KurentoClient...');
            return new Promise((resolve, reject) =>
                new kurentoClient(streamingSettings.kurentoWsUri, (error, kurentoClient) => {
                    if (error) {
                        this.logger.error('Failed to create KurentoClient.');
                        return reject(new KurentoClientError('An error occurred while creating kurento client', error));
                    }

                    this.logger.debug('KurentoClient created successfully.');
                    resolve(kurentoClient);
                }));
        }

        private createMediaPipelineCb(kurentoClient: Kurento.Client.IKurentoClient, callback: (err, result: Kurento.Client.IMediaPipeline) => void): void {
            if (this.createdPipelines.length > 0) {
                this.logger.debug('MediaPipeline was already created. Reusing existing one.');
                return callback(null, this.createdPipelines[0]);
            }
            this.logger.debug('Creating MediaPipeline...');
            kurentoClient.create("MediaPipeline", (error, p) => {
                if (error)
                    return this.logger.error('Failed to create MediaPipeline.');

                this.logger.debug('MediaPipeline created successfully.');
                callback(null, p);
            });
        }

        private createMediaPipeline(kurentoClient: Kurento.Client.IKurentoClient): Promise<Kurento.Client.IMediaPipeline> {
            this.logger.debug('Creating MediaPipeline...');
            return new Promise((resolve, reject) => {
                kurentoClient.create("MediaPipeline", (error, p) => {
                    if (error) {
                        this.logger.error('Failed to create MediaPipeline.');
                        return reject(new KurentoClientError('An error occurred while creating media pipeline', error));
                    }

                    this.logger.debug('MediaPipeline created successfully.');
                    this.createdPipelines.push(p);
                    resolve(p);
                });
            });
        }

        private createPlayerToWebRtcBundle(mediaPipeline: Kurento.Client.IMediaPipeline, rtspUrl: string): Promise<PlayerToWebRtcBundle> {
            this.logger.debug('Creating PlayerEndpoint and WebRtcEndpoint...');

            return new Promise((resolve, reject) => {
                this.createPlayerAndWebRtcEndpointCb(rtspUrl, mediaPipeline, (err, res) => {
                    if (err) {
                        this.logger.error('Failed to create ' + rtspUrl.length + ' PlayerEndpoint(s) and WebRtcEndpoint(s) created.', err);
                        return reject(err);
                    }

                    this.logger.debug(rtspUrl.length + ' PlayerEndpoint(s) and WebRtcEndpoint(s) created.');
                    this.connectPlayerEndpointToWebRtcEndpoint(res.playerEndpoint, res.webRtcEndpoint, mediaPipeline)
                        .then(resolve, reject);
                });
            });

            //var playerPromises = this.createPlayerEndpoints(rtspUrls, mediaPipeline);
            //var webRtcPromises = this.createWebRtcEndpoints(mediaPipeline, rtspUrls.length);

            //return playerPromises.then(playerEndpoints => {
            //    this.logger.debug('PlayerEndpoints created.');
            //    return webRtcPromises.then(webRtcEndpoints => {
            //        this.logger.debug('WebRtcEndpoints created.');
            //        return this.connectPlayerEndpointsToWebRtcEndpoints(playerEndpoints, webRtcEndpoints, mediaPipeline);
            //    });
            //});
        }

        private createPlayerAndWebRtcEndpointCb(
            rtspUrls: string,
            mediaPipeline: Kurento.Client.IMediaPipeline,
            callback: (err, result?: {
                playerEndpoint?: Kurento.Client.IPlayerEndpoint,
                webRtcEndpoint?: Kurento.Client.IWebRtcEndpoint
            }) => void): void {

            var result: {
                playerEndpoint?: Kurento.Client.IPlayerEndpoint,
                webRtcEndpoint?: Kurento.Client.IWebRtcEndpoint
            } = {};
            mediaPipeline.create("PlayerEndpoint", { uri: rtspUrls }, (err, r) => {
                if (err)
                    return callback(err);
                result.playerEndpoint = r;
                if (result.webRtcEndpoint)
                    callback(null, result);
            });
            mediaPipeline.create('WebRtcEndpoint', (err, r) => {
                if (err)
                    return callback(err);
                result.webRtcEndpoint = r;
                if (result.playerEndpoint)
                    callback(null, result);
            });
        }

        private createPlayerEndpoints(rtspUrls: string[], mediaPipeline: Kurento.Client.IMediaPipeline): Promise<Kurento.Client.IPlayerEndpoint[]> {
            var promises = rtspUrls.map(url => mediaPipeline.create("PlayerEndpoint", { uri: url }).then(p => { this.logger.debug('PlayerEndpoint created.'); return p; }));
            return Promise.all(promises).then(results => { this.logger.debug('All PlayerEndpoints created.'); return results; });
        }

        private createWebRtcEndpoints(mediaPipeline: Kurento.Client.IMediaPipeline, count: number): Promise<Kurento.Client.IWebRtcEndpoint[]> {
            var promises: Promise<Kurento.Client.IWebRtcEndpoint>[] = [];
            for (var i = 0; i < count; i++)
                promises.push(mediaPipeline.create('WebRtcEndpoint'));
            return Promise.all(promises);
        }

        private connectPlayerEndpointToWebRtcEndpoint(
            playerEndpoint: Kurento.Client.IPlayerEndpoint,
            webRtcEndpoint: Kurento.Client.IWebRtcEndpoint,
            mediaPipeline: Kurento.Client.IMediaPipeline): Promise<PlayerToWebRtcBundle> {

            this.logger.debug('Connecting PlayerEndpoint to WebRtcEndpoint...');
            this.logger.debug('    1. Creating GStreamerFilter...');
            return mediaPipeline.create('GStreamerFilter', { command: 'capsfilter caps=video/x-raw,framerate=15/1', filterType: 'VIDEO' })
                .then(gstFilter => {
                    this.logger.debug('       GStreamerFilter created.');
                    this.logger.debug('    2. Connecting PlayerEndpoint to GStreamerFilter...');
                    return playerEndpoint.connect(gstFilter)
                        .then(() => {
                            this.logger.debug('       Connected.');
                            this.logger.debug('    3. Connecting GStreamerFilter to WebRtcEndpoint...');
                            return gstFilter.connect(webRtcEndpoint);
                        })
                        .then(() => {
                            this.logger.debug('       Connected.');
                            this.logger.debug('PlayerEndpoint to WebRtcEndpoint connection complete.');
                            return new PlayerToWebRtcBundle(playerEndpoint, webRtcEndpoint, gstFilter);
                        })
                });
        }
    }
}

/* ****************** */
/* Promise playground */
/* ****************** */

/*

function fetch(url): Promise<any> { return null; };

var pf1 = function () {
    return new Promise(function (resolve, reject) {
        resolve('hello');
    });
}
var pf2 = function (res) {
    return Promise.all(
        [new Promise(function (resolve, reject) {
            resolve(res + ' world');
        }),
            fetch('https://www.google.ru/search?q=foo').then(pf3).then(pf4)]);
}
var pf3 = function (resp) {
    return new Promise(function (resolve, reject) {
        resolve('Status:' + resp.status);
    });
}
var pf4 = function (statusStr) {
    return new Promise(function (resolve, reject) {
        resolve('Wrapped ' + statusStr);
    });
}

pf1().then(pf2).then(function (res) {
    console.log('Final result:', res[0], res[1]);
});

*/