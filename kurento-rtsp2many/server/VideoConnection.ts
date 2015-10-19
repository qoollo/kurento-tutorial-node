
import KurentoPlayer = require('./KurentoPlayer');

class VideoConnection {

    constructor(
        private _player: KurentoPlayer,
        private _client: Storage.IVideoConsumer,
        private logger: Console) {

    }

    public get player(): KurentoPlayer {
        return this._player;
    }

    public get client(): Storage.IVideoConsumer {
        return this._client;
    }

    public get sdpAnswer(): string {
        return this._sdpAnswer;
    }
    private _sdpAnswer: string;

    private _webRtcEndpoint: Kurento.Client.IWebRtcEndpoint;

    public connect(
        sdpOffer: string,
        mediaPipeline: Kurento.Client.IMediaPipeline,
        playerEndpoint: Kurento.Client.IPlayerEndpoint,
        callback: IConnectCallback) {

        mediaPipeline.create('WebRtcEndpoint', (err, webRtcEndpoint) => {
            if (err)
                return callback('An error occurred while trying to create WebRtc endpoint' + err.toString());

            this.logger.debug('WebRtcEndpoint created');
            this._webRtcEndpoint = webRtcEndpoint;

            var finalSdpAnswer = null,
                playerPlaying = false;

            this._webRtcEndpoint.processOffer(sdpOffer, (err, sdpAnswer) => {
                if (err)
                    return callback('An error occurred while WebRtc endpoint trying to process offer' + err.toString());

                this.logger.debug('SdpOffer processed SdpOffer:', sdpOffer, '. SdpAnswer:', sdpAnswer);
                finalSdpAnswer = sdpAnswer;
                if (playerPlaying) {
                    this._sdpAnswer = finalSdpAnswer;
                    callback(null, finalSdpAnswer);
                }
            });

            mediaPipeline.create('GStreamerFilter', { command: 'capsfilter caps=video/x-raw,framerate=25/1', filterType: "VIDEO" }, (err, gstFilter) => {
                if (err)
                    return console.error("Failed to create GStreamerFilter.", err);

                this.logger.debug("Successfully created GStreamerFilter.", err);
                playerEndpoint.connect(gstFilter, err => {
                    if (err)
                        return console.error("Failed to connect PLayerEndpoint to GStreamerFilter.", err);

                    this.logger.debug("Successfully connected PLayerEndpoint to GStreamerFilter.", err);
                    gstFilter.connect(this._webRtcEndpoint, err => {
                        if (err)
                            return console.error("Failed to connect GStreamerFilter to WebRtcEndpoint", err);

                        this.logger.debug("Successfully connected GStreamerFilter to WebRtcEndpoint.", err);
                        playerEndpoint.play(err => {
                            if (err)
                                return console.error('Failed to start playing.');

                            this.logger.debug('Successfully started playing by PlayerEndpoint');
                            playerPlaying = true;
                            if (finalSdpAnswer) {
                                this._sdpAnswer = finalSdpAnswer;
                                callback(null, finalSdpAnswer);
                            }
                        });
                    });
                });
            });
        });
    }
}

interface IConnectCallback {
    (err, sdpAnswer?: string): void;
}

export = VideoConnection;