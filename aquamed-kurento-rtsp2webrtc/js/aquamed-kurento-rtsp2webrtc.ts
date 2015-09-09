/// <reference path="../typings/es6-promise.d.ts" />
/// <reference path="../typings/kurento-client.d.ts" />
/// <reference path="../typings/kurento-utils.d.ts" />

class StreamingSettings {
    constructor(
        public kurentoWsUri: string = null,
        public streamingRtsp: string|string[] = null,
        public iceServers: string = null) {
    }
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
    startStreaming(streamingSettings: StreamingSettings, videoElement): Promise<StartStreamingResponse> {
        if (!(streamingSettings instanceof StreamingSettings)
            || !streamingSettings.kurentoWsUri
            || !streamingSettings.streamingRtsp)
            throw new KurentoClientError('Incorrect streaming settings', streamingSettings);

        return new Promise((startResponse, startReject) => {

            var responseData = new StartStreamingResponse();

            var videoElementWrapper = videoElement || {};

            new Promise((startRecvResponse, startRecvReject) => {

                responseData.webRtcPeer = kurentoUtils.WebRtcPeer.startRecvOnly(videoElementWrapper, startRecvResponse, startRecvReject);

            })
                .then(sdpOffer => {

                    return new Promise((resolve, reject) => {

                        new kurentoClient(streamingSettings.kurentoWsUri, (error, kurentoClient) => {
                            if (error) reject(new KurentoClientError('An error occurred while creating kurento client', error));

                            kurentoClient.create("MediaPipeline", (error, p) => {
                                if (error) reject(new KurentoClientError('An error occurred while creating media pipeline', error));

                                responseData.pipeline = p;

                                this.createPlayerEndpoint(sdpOffer, streamingSettings.streamingRtsp, responseData)
                                    .then(resolve, reject);
                            });
                        });
                    })
                },
                    error => new Promise((response, reject) => {
                        reject(new KurentoClientError('An error occurred while starting receiving', error))
                    }))
                .then(
                    () => startResponse(new StartStreamingResponse(responseData.webRtcPeer, responseData.pipeline, videoElementWrapper.src)),
                    error => {
                        responseData.stop();
                        startReject(error);
                    })

        })
    }

    private createPlayerEndpoint(sdpOffer, rtspUrls: string|string[], responseData: StartStreamingResponse) {
        var urlArray = typeof rtspUrls === 'string' ? [<string>rtspUrls] : <string[]>rtspUrls,
            promises = urlArray.map(url =>
                responseData.pipeline.create("PlayerEndpoint", { uri: url })
                    .then(playerEndpoint => this.createWebRtcEndpoint(sdpOffer, playerEndpoint, responseData)));
        return Promise.all(promises);
    }

    private createWebRtcEndpoint(sdpOffer, player: Kurento.Client.IPlayerEndpoint, responseData: StartStreamingResponse) {
        return new Promise((resolve, reject) =>
            responseData.pipeline.create('WebRtcEndpoint')
                .then(webRtc => {

                    var promises = [];

                    /* error from WebRtcPeer.processSdpAnswer() is only available in errorCallback passed to WebRtcPeer constructor */
                    promises.push(
                        webRtc.processOffer(sdpOffer).then(sdpAnswer =>
                            responseData.webRtcPeer.processSdpAnswer(sdpAnswer)));

                    promises.push(
                        responseData.pipeline.create('GStreamerFilter', { command: 'capsfilter caps=video/x-raw,framerate=15/1', filterType: 'VIDEO' })
                            .then(gstFilter => {
                                player.connect(gstFilter, error => {
                                    if (error)
                                        reject(new KurentoClientError('An error occurred while player is connected', error));

                                    gstFilter.connect(webRtc, error => {
                                        if (error)
                                            reject(new KurentoClientError('An error occurred while GStreamer filter is connected', error));

                                        player.play(error => {
                                            if (error)
                                                reject(new KurentoClientError('An error occurred while player started', error));

                                            resolve(); // OK!
                                        });
                                    });
                                });
                            }));

                    return Promise.all(promises);
                }));
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
        fetch('https://www.google.ru/search?q=foo')]);
}

pf1().then(pf2).then(function (res) {
    console.log('Final result:', res[0], res[1].status);
});

*/