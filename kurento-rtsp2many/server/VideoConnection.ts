
import KurentoPlayer = require('./KurentoPlayer');
import Utils = require('./Utils');

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

        if (this.disposed) {
            var msg = 'VideoConnection.connect() cannot ba called on a disposed VIdeoConnection.';
            this.logger.error(msg, { 'class': 'VideoConnection', method: 'connect' });
            return callback(msg);
        }

        mediaPipeline.create('WebRtcEndpoint', (err, webRtcEndpoint) => {
            if (err)
                return callback('An error occurred while trying to create WebRtc endpoint' + err.toString());

            this.logger.debug('WebRtcEndpoint created');
            this.setWebRtcEndpoint(webRtcEndpoint);

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

    private setWebRtcEndpoint(webRtcEndpoint: Kurento.Client.IWebRtcEndpoint): void {
        this._webRtcEndpoint = webRtcEndpoint;
        this._webRtcEndpoint.addListener('MediaSessionStarted', ev => this.webRtcEndpointMediaSessionStartedListener(ev));
        this._webRtcEndpoint.addListener('MediaSessionTerminated', ev => this.webRtcEndpointMediaSessionTerminatedListener(ev));
        this._webRtcEndpoint.addListener('Error', err => this.webRtcEndpointErrorListener(err));
    }

    private onWebRtcEndpointError(err: any): void {
        this.logger.error(`Error in WebRtcEndpoint. Stream: "${this._player.streamUrl}". Client: ${this._client.clientId}.`,
            { 'class': 'VideoConnection', 'method': 'onWebRtcEndpointError', 'error': err });
    }
    private webRtcEndpointErrorListener: (err) => any = err => this.onWebRtcEndpointError(err);

    private onWebRtcEndpointMediaSessionStarted(ev: any): void {
        this.logger.info(`MediaSessionStarted for WebRtcEndpoint. Stream: "${this._player.streamUrl}". Client: ${this._client.clientId}.`,
            { 'class': 'VideoConnection', 'method': 'onWebRtcEndpointMediaSessionStarted', 'event': ev });
    }
    private webRtcEndpointMediaSessionStartedListener: (err) => any = ev => this.onWebRtcEndpointMediaSessionStarted(ev);

    private onWebRtcEndpointMediaSessionTerminated(ev: any): void {
        this.logger.info(`MediaSessionTerminated for WebRtcEndpoint. Stream: "${this._player.streamUrl}". Client: ${this._client.clientId}.`,
            { 'class': 'VideoConnection', 'method': 'onWebRtcEndpointMediaSessionTerminated', 'event': ev });
    }
    private webRtcEndpointMediaSessionTerminatedListener: (err) => any = ev => this.onWebRtcEndpointMediaSessionTerminated(ev);

    dispose(): Promise<any> {
        if (this.disposed)
            return Promise.resolve();

        this.disposed = true;
        if (this._webRtcEndpoint) {
            this._webRtcEndpoint.removeListener('MediaSessionStarted', ev => this.webRtcEndpointMediaSessionStartedListener(ev));
            this._webRtcEndpoint.removeListener('MediaSessionTerminated', ev => this.webRtcEndpointMediaSessionTerminatedListener(ev));
            this._webRtcEndpoint.removeListener('Error', err => this.webRtcEndpointErrorListener(err));
            return this._webRtcEndpoint.release();
        }

        return Promise.resolve();
    }
    private disposed: boolean = false;
}

interface IConnectCallback {
    (err, sdpAnswer?: string): void;
}

export = VideoConnection;