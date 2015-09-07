

function StreamingSettings(kurentoWsUri, streamingRtsp, iceServers) {

    this.kurentoWsUri = kurentoWsUri || null;

    this.streamingRtsp = streamingRtsp || null;
    
    this.iceServers = iceServers || null;
}

function StartStreamingResponse(webRtcPeer, pipeline, src) {
    
    this.webRtcPeer = webRtcPeer;
    
    this.pipeline = pipeline;

    this.src = src;

    this.stop = function () {
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

function Error(message, data) {
    this.message= message;
    this.data = data;
}

function RtspStreamingManager() {
    this.startStreaming = function (streamingSettings, videoElement) {
        if (!(streamingSettings instanceof StreamingSettings)
            || !streamingSettings.kurentoWsUri
            || !streamingSettings.streamingRtsp)
            throw new Error('Incorrect streaming settings', streamingSettings);

        return new Promise(function (startResponse, startReject) {

            var responseData = {
                webRtcPeer: null,
                pipeline: null,
                stop: function () {
                    if (this.webRtcPeer) {
                        this.webRtcPeer.dispose();
                        this.webRtcPeer = null;
                    }
                    if (this.pipeline) {
                        this.pipeline.release();
                        this.pipeline = null;
                    }
                }
            };

            var videoElementWrapper = videoElement || { };

            new Promise(function (startRecvResponse, startRecvReject) {

                responseData.webRtcPeer = kurentoUtils.WebRtcPeer.startRecvOnly(videoElementWrapper, startRecvResponse, startRecvReject);

            }).then(function (sdpOffer) {

                return new Promise(function (resolve, reject) {

                    kurentoClient(streamingSettings.kurentoWsUri, function (error, kurentoClient) {
                        if (error) reject(new Error('An error occurred while creating kurento client', error));

                        kurentoClient.create("MediaPipeline", function (error, p) {
                            if (error) reject(new Error('An error occurred while creating media pipeline', error));

                            responseData.pipeline = pipeline = p;

                            createPlayerEndpoint(pipeline, sdpOffer, streamingSettings.streamingRtsp, responseData)
                                .then(resolve, reject);
                            
                            //pipeline.create("PlayerEndpoint", { uri: streamingSettings.streamingRtsp }, function (error, player) {
                            //    if (error) reject(new Error('An error occurred while creating player endpoint', error));

                            //    pipeline.create("WebRtcEndpoint", function (error, webRtc) {
                            //        if (error) reject(new Error('An error occurred while creating WebRTC endpoint', error));

                            //        webRtc.processOffer(sdpOffer, function (error, sdpAnswer) {
                            //            if (error) reject(new Error('An error occurred while process offer', error));

                            //            responseData.webRtcPeer.processSdpAnswer(sdpAnswer);
                            //        });

                            //        pipeline.create('GStreamerFilter', { command: 'capsfilter caps=video/x-raw,framerate=15/1', filterType: "VIDEO" }, function (error, gstFilter) {
                            //            if (error) reject(new Error('An error occurred while creating GStreamer filter', error));

                            //            player.connect(gstFilter, function (error) {
                            //                if (error) reject(new Error('An error occurred while player is connected', error));

                            //                gstFilter.connect(webRtc, function (error) {
                            //                    if (error) reject(new Error('An error occurred while GStreamer filter is connected', error));

                            //                    player.play(function (error) {
                            //                        if (error) reject(new Error('An error occurred while player started', error));

                            //                        resolve(); // OK!
                            //                    });
                            //                });
                            //            });
                            //        });
                            //    });
                            //});
                        });
                    });
                })
            }, function (error) {
                return new Promise(function (response, reject) {
                    reject(new Error('An error occurred while starting receiving', error))
                })
            }).then(function () {
                startResponse(new StartStreamingResponse(responseData.webRtcPeer, responseData.pipeline, videoElementWrapper.src));
            }, function (error) {
                responseData.stop();
                startReject(error);
            })
            
        })
    }

    function createPlayerEndpoint(pipeline, sdpOffer, rtspUrls, responseData) {
        if (typeof rtspUrls === 'string')
            rtspUrls = [rtspUrls];
        var promises = [];
        for (var i = 0; i < rtspUrls.length; i++) {
            promises.push(new Promise(function (resolve, reject) {
                pipeline.create("PlayerEndpoint", { uri: rtspUrls[i] }, function (error, player) {
                    if (error)
                        reject(new Error('An error occurred while creating player endpoint', error));
                    createWebRtcEndpoint(pipeline, sdpOffer, player, responseData).then(resolve, reject);
                });
            }));
        }
        return Promise.all(promises);
    }

    function createWebRtcEndpoint(pipeline, sdpOffer, player, responseData) {
        return new Promise(function (resolve, reject) {
            pipeline.create("WebRtcEndpoint", function (error, webRtc) {
                if (error)
                    reject(new Error('An error occurred while creating WebRTC endpoint', error));

                webRtc.processOffer(sdpOffer, function (error, sdpAnswer) {
                    if (error)
                        reject(new Error('An error occurred while process offer', error));

                    responseData.webRtcPeer.processSdpAnswer(sdpAnswer);
                });

                pipeline.create('GStreamerFilter', { command: 'capsfilter caps=video/x-raw,framerate=15/1', filterType: "VIDEO" }, function (error, gstFilter) {
                    if (error)
                        reject(new Error('An error occurred while creating GStreamer filter', error));

                    player.connect(gstFilter, function (error) {
                        if (error)
                            reject(new Error('An error occurred while player is connected', error));

                        gstFilter.connect(webRtc, function (error) {
                            if (error)
                                reject(new Error('An error occurred while GStreamer filter is connected', error));

                            player.play(function (error) {
                                if (error)
                                    reject(new Error('An error occurred while player started', error));

                                resolve(); // OK!
                            });
                        });
                    });
                });
            });
        });
    }
}
