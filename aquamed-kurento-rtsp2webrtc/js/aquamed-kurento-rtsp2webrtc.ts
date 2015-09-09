/// <reference path="../typings/es6-promise.d.ts" />
/// <reference path="../typings/kurento-client.d.ts" />
/// <reference path="../typings/kurento-utils.d.ts" />

class StreamingSettings {
    constructor(
        public kurentoWsUri: string = null,
        public streamingRtsp: string|string[] = null,
        public iceServers: string = null) {
    }

    get rtspUrls(): string[] {
        return typeof this.streamingRtsp === 'string' ? [<string>this.streamingRtsp] : <string[]>this.streamingRtsp
    }
}

class PlayerToWebRtcBundle {

    constructor(
        private _playerEndpoint: Kurento.Client.IPlayerEndpoint,
        private _webRtcEndpoint: Kurento.Client.IWebRtcEndpoint,
        ...filters: Kurento.Client.IFilter[]) {

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
}

class StartStreamingResponse {

    constructor(
        public webRtcPeer: Kurento.Utils.IWebRtcPeer = null,
        public pipeline: Kurento.Client.IMediaPipeline = null,
        public src: string = null) {
    }

    stop(): void {
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

class KurentoClientError {

    constructor(public message, public data) {
        this.message = message;
        this.data = data;
    }
}

class RtspStreamingManager {


    startStreaming(streamingSettings: StreamingSettings, videoElement: HTMLVideoElement): Promise<StartStreamingResponse> {
        if (!(streamingSettings instanceof StreamingSettings)
            || !streamingSettings.kurentoWsUri
            || !streamingSettings.streamingRtsp)
            throw new KurentoClientError('Incorrect streaming settings', streamingSettings);

        return new Promise((startResponse, startReject) => {

            var responseData = new StartStreamingResponse();

            this.createWebRtcPeerAndGetSdpOffer(videoElement, responseData)
                .then(sdpOffer =>
                    this.createKurentoClient(streamingSettings)
                        .then(kurentoClient => this.createMediaPipeline(kurentoClient)
                            .then(mediaPipeline => {
                                responseData.pipeline = mediaPipeline;
                                return this.createPlayerToWebRtcBundles(mediaPipeline, streamingSettings.rtspUrls);
                            }))
                        .then(bundles => {
                            Promise.all(bundles.map(b => b.playerEndpoint.play()));
                            bundles.forEach(b => b.webRtcEndpoint.processOffer(sdpOffer).then(sdpAnswer =>
                                responseData.webRtcPeer.processSdpAnswer(sdpAnswer)));
                        }))
                .then(() => responseData.src = videoElement.src,
                    error => {
                        responseData.stop();
                        startReject(error);
                    })

        })
    }

    private createKurentoClient(streamingSettings: StreamingSettings): Promise<Kurento.Client.IKurentoClient> {
        return new Promise((resolve, reject) =>
            new kurentoClient(streamingSettings.kurentoWsUri, (error, kurentoClient) => {
                if (error)
                    reject(new KurentoClientError('An error occurred while creating kurento client', error));
                else
                    resolve(kurentoClient);
            }));
    }

    private createMediaPipeline(kurentoClient: Kurento.Client.IKurentoClient): Promise<Kurento.Client.IMediaPipeline> {
        return new Promise((resolve, reject) => {
            kurentoClient.create("MediaPipeline", (error, p) => {
                if (error)
                    reject(new KurentoClientError('An error occurred while creating media pipeline', error));
                else
                    resolve(p);
            });
        });
    }

    private createWebRtcPeerAndGetSdpOffer(videoElement: HTMLVideoElement, responseData: StartStreamingResponse): Promise<string> {
        return new Promise((resolve, reject) =>
            responseData.webRtcPeer = kurentoUtils.WebRtcPeer.startRecvOnly(videoElement, resolve, reject));
    }

    private createPlayerToWebRtcBundles(mediaPipeline: Kurento.Client.IMediaPipeline, rtspUrls: string[]): Promise<PlayerToWebRtcBundle[]> {
        var playerPromises = this.createPlayerEndpoints(rtspUrls, mediaPipeline);
        var webRtcPromises = this.createWebRtcEndpoints(mediaPipeline, rtspUrls.length);

        return playerPromises.then(playerEndpoints =>
            webRtcPromises.then(webRtcEndpoints =>
                this.connectPlayerEndpointsToWebRtcEndpoints(playerEndpoints, webRtcEndpoints, mediaPipeline)));
    }

    private createPlayerEndpoints(rtspUrls: string[], mediaPipeline: Kurento.Client.IMediaPipeline): Promise<Kurento.Client.IPlayerEndpoint[]> {
        var promises = rtspUrls.map(url => mediaPipeline.create("PlayerEndpoint", { uri: url }));
        return Promise.all(promises);
    }

    private createWebRtcEndpoints(mediaPipeline: Kurento.Client.IMediaPipeline, count: number): Promise<Kurento.Client.IWebRtcEndpoint[]> {
        var promises: Promise<Kurento.Client.IWebRtcEndpoint>[] = [];
        for (var i = 0; i < count; i++)
            promises.push(mediaPipeline.create('WebRtcEndpoint'));
        return Promise.all(promises);
    }

    private connectPlayerEndpointsToWebRtcEndpoints(
        playerEndpoints: Kurento.Client.IPlayerEndpoint[],
        webRtcEndpoints: Kurento.Client.IWebRtcEndpoint[],
        mediaPipeline: Kurento.Client.IMediaPipeline): Promise<PlayerToWebRtcBundle[]> {

        if (playerEndpoints.length != webRtcEndpoints.length) {
            if (playerEndpoints.length < webRtcEndpoints.length)
                console.warn('Method connectPlayerEndpointsToWebRtcEndpoints() called with suspicious arguments: playerEndpoints.length is less than webRtcEndpoints.length.');
            else
                throw new Error('Method connectPlayerEndpointsToWebRtcEndpoints() called with wrong arguments: playerEndpoints.length is greater than webRtcEndpoints.length.');
        }
        var promises = playerEndpoints.map((pe, i) => this.connectPlayerEndpointToWebRtcEndpoint(pe, webRtcEndpoints[i], mediaPipeline));

        return Promise.all(promises);
    }

    private connectPlayerEndpointToWebRtcEndpoint(
        playerEndpoint: Kurento.Client.IPlayerEndpoint,
        webRtcEndpoint: Kurento.Client.IWebRtcEndpoint,
        mediaPipeline: Kurento.Client.IMediaPipeline): Promise<PlayerToWebRtcBundle> {

        return mediaPipeline.create('GStreamerFilter', { command: 'capsfilter caps=video/x-raw,framerate=15/1', filterType: 'VIDEO' })
            .then(gstFilter =>
                playerEndpoint.connect(gstFilter)
                    .then(() => gstFilter.connect(webRtcEndpoint))
                    .then(() => new PlayerToWebRtcBundle(playerEndpoint, webRtcEndpoint, gstFilter)));
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