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
        return new Promise((resolve, reject) => {
            responseData.pipeline.create("WebRtcEndpoint", (error, webRtc) => {
                if (error)
                    reject(new KurentoClientError('An error occurred while creating WebRTC endpoint', error));

                webRtc.processOffer(sdpOffer, (error, sdpAnswer) => {
                    if (error)
                        reject(new KurentoClientError('An error occurred while process offer', error));

                    responseData.webRtcPeer.processSdpAnswer(sdpAnswer);
                });

                responseData.pipeline.create('GStreamerFilter', { command: 'capsfilter caps=video/x-raw,framerate=15/1', filterType: 'VIDEO' }, (error, gstFilter) => {
                    if (error)
                        reject(new KurentoClientError('An error occurred while creating GStreamer filter', error));

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
                });
            });
        });
    }
}
