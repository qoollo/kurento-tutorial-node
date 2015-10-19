
import KurentoServer = require('./KurentoServer');
import PlayerStatus = require('./PlayerStatus');
import VideoConnection = require('./VideoConnection');

/**
 * Represents player that is playing stream inside remote Kurento Media Server
 */
class KurentoPlayer {
	
	/**
	 * @param {KurentoClient} _kurentoClient 
	 * 	KurentoClient for remote Kurento Media Server
	 */
    constructor(private _kurentoServer: KurentoServer, private _streamUrl: string, private logger: Console) {
    }

    public get server(): KurentoServer {
        return this._kurentoServer;
    }

    public get streamUrl(): string {
        return this._streamUrl;
    }

    private _pipeline: Kurento.Client.IMediaPipeline = null;

    private _player: Kurento.Client.IPlayerEndpoint = null;

    private playerCreationStarted: boolean = false;
    public get status(): PlayerStatus {
        return this._status;
    }
    private _status: PlayerStatus = PlayerStatus.NotCreated;

    private playCallbacks: IPlayCallback[] = [];

    play(callback: IPlayCallback) {
        if (this._status == PlayerStatus.Created) {
            this.logger.warn('[KurentoPlayer.play()] KurentoPlayer is already created. Returning existing one.');
            callback(null, this._player);
        } else if (this._status == PlayerStatus.Creating) {
            this.logger.debug('[KurentoPlayer.play()] KurentoPlayer is being created. Returning existing promise.');
            this.playCallbacks.push(callback);
        } else if (this._status == PlayerStatus.NotCreated) {
            this.logger.debug('[KurentoPlayer.play()] KurentoPlayer creation started.');
            this._status = PlayerStatus.Creating;
            this.playCallbacks.push(callback);

            this.server.getClient((err, kurentoClient) => {
                if (err)
                    return this.onPlayFailed(`An error occurred while creating KurentoClient on ${this.toString() } - ${this.errorToString(err) }.`);

                this.logger.debug('[KurentoPlayer.play()] kurentoClient acquired.');

                kurentoClient.create('MediaPipeline', (err, p) => {
                    if (err)
                        return this.onPlayFailed(`An error occurred while creating media pipeline on ${this.toString() } - ${this.errorToString(err) }.`);

                    this.logger.debug('MediaPipeline created.');

                    this._pipeline = p;

                    this._pipeline.create("PlayerEndpoint", { uri: this._streamUrl }, (err, player: Kurento.Client.IPlayerEndpoint) => {
                        if (err)
                            return this.onPlayFailed(`An error occurred while master trying to create PlayerEndpoint on ${this.toString() } - ${this.errorToString(err) }`);

                        this.logger.debug(`PlayerEndpoint created on ${this.toString() }.`);

                        this._player = player;
                        this.onPlaySucceeded(player);
                    })
                });
            });
        } else
            this.logger.error('KurentoPlayer.play(): unexpected PlayerStatus - ' + PlayerStatus[this._status]);
    }

    public createVideoConnection(client: Storage.IVideoConsumer, sdpOffer: string, callback: IVideoConnectionCallback) {
        var connection = new VideoConnection(this, client, this.logger);
        connection.connect(sdpOffer, this._pipeline, this._player, (err, sdpAnswer) => {
            if (err)
                return callback(err);
            callback(null, connection);
        });
    }

    private onPlayFailed(errorMessage: string): any {
        this._status = PlayerStatus.NotCreated;
        this.logger.error(errorMessage);
        this.playCallbacks.forEach(c => c(errorMessage));
        return this.playCallbacks.length = 0;
    }

    private onPlaySucceeded(player: Kurento.Client.IPlayerEndpoint): any {
        this._status = PlayerStatus.Created;
        this.logger.info(`${this.toString() } created successfully`);
        this.playCallbacks.forEach(c => c(null, player));
        return this.playCallbacks.length = 0;
    }

    private errorToString(err: any): string {
        var res: string = '';
        if ('name' in err) {
            res += err.name + ': ';
        }
        if ('message' in err) {
            res += err.message; Error
        }
        if (typeof err === 'string')
            res = err;
        return res;
    }

    public toString(): string {
        return `{KurentoPlayer (Server: ${this._kurentoServer.kurentoUrl}, Stream: ${this.streamUrl}, Status: ${PlayerStatus[this._status]}) }`;
    }
}

interface IPlayCallback {
    (err, player?: Kurento.Client.IPlayerEndpoint): void;
}

interface IVideoConnectionCallback {
    (err, connection?: VideoConnection): void;
}

export = KurentoPlayer;