/// <reference path="../typings/es6-promise.d.ts" />
/// <reference path="../typings/kurento-client.d.ts" />
/// <reference path="../typings/kurento-utils.d.ts" />

class StreamingSettings {
    constructor(
        public kurentoWsUri: string = null,
        public streamingRtsp: string = null,
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
    startStreaming(streamingSettings, videoElement): Promise<StartStreamingResponse> {
        if (!(streamingSettings instanceof StreamingSettings)
            || !streamingSettings.kurentoWsUri
            || !streamingSettings.streamingRtsp)
            throw new KurentoClientError('Incorrect streaming settings', streamingSettings);

        return new Promise(function (startResponse, startReject) {

            var responseData = new StartStreamingResponse();

            var videoElementWrapper = videoElement || { };

            new Promise(function (startRecvResponse, startRecvReject) {

                responseData.webRtcPeer = kurentoUtils.WebRtcPeer.startRecvOnly(videoElementWrapper, startRecvResponse, startRecvReject);

            }).then(function (sdpOffer) {

                return new Promise(function (resolve, reject) {

                    new kurentoClient(streamingSettings.kurentoWsUri, function (error, kurentoClient) {
                        if (error) reject(new KurentoClientError('An error occurred while creating kurento client', error));

                        kurentoClient.create("MediaPipeline", function (error, p) {
                            if (error) reject(new KurentoClientError('An error occurred while creating media pipeline', error));

                            responseData.pipeline = p;

                            this.createPlayerEndpoint(sdpOffer, streamingSettings.streamingRtsp, responseData)
                                .then(resolve, reject);
                        });
                    });
                })
            }, function (error) {
                return new Promise(function (response, reject) {
                    reject(new KurentoClientError('An error occurred while starting receiving', error))
                })
            }).then(function () {
                startResponse(new StartStreamingResponse(responseData.webRtcPeer, responseData.pipeline, videoElementWrapper.src));
            }, function (error) {
                responseData.stop();
                startReject(error);
            })
            
        })
    }

    private createPlayerEndpoint(sdpOffer, rtspUrls, responseData: StartStreamingResponse) {
        if (typeof rtspUrls === 'string')
            rtspUrls = [rtspUrls];
        var promises = [];
        for (var i = 0; i < rtspUrls.length; i++) {
            promises.push(new Promise(function (resolve, reject) {
                responseData.pipeline.create("PlayerEndpoint", { uri: rtspUrls[i] }, function (error, player) {
                    if (error)
                        reject(new KurentoClientError('An error occurred while creating player endpoint', error));
                    this.createWebRtcEndpoint(sdpOffer, player, responseData).then(resolve, reject);
                });
            }));
        }
        return Promise.all(promises);
    }

    private createWebRtcEndpoint(sdpOffer, player: Kurento.Client.IPlayerEndpoint, responseData: StartStreamingResponse) {
        return new Promise(function (resolve, reject) {
            responseData.pipeline.create("WebRtcEndpoint", function (error, webRtc) {
                if (error)
                    reject(new KurentoClientError('An error occurred while creating WebRTC endpoint', error));

                webRtc.processOffer(sdpOffer, function (error, sdpAnswer) {
                    if (error)
                        reject(new KurentoClientError('An error occurred while process offer', error));

                    responseData.webRtcPeer.processSdpAnswer(sdpAnswer);
                });
                
                responseData.pipeline.create('GStreamerFilter', { command: 'capsfilter caps=video/x-raw,framerate=15/1', filterType: 'VIDEO', mediaPipeline: responseData.pipeline }, function (error, gstFilter) {
                    if (error)
                        reject(new KurentoClientError('An error occurred while creating GStreamer filter', error));

                    player.connect(gstFilter, function (error) {
                        if (error)
                            reject(new KurentoClientError('An error occurred while player is connected', error));

                        gstFilter.connect(webRtc, function (error) {
                            if (error)
                                reject(new KurentoClientError('An error occurred while GStreamer filter is connected', error));

                            player.play(function (error) {
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
