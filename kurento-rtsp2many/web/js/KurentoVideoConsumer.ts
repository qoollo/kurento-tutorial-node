
import ConnectionState = require('../../server/ConnectionState');
import KurentoHubClient = require('./KurentoHubClient');
import KurentoPlayer = require('./KurentoPlayer');

class KurentoVideoConsumer {

    constructor(kurentoHubDomain: string, logger: Console = console) {
        this.logger = logger;

        this.hub = new KurentoHubClient(KurentoVideoConsumer.crossbarConfig, kurentoHubDomain, logger);
    }

    private logger: Console;
    private hub: KurentoHubClient = null;
    private players: KurentoPlayer[] = [];

    public playStream(streamUrl: string): Promise<KurentoPlayer> {
        //if (this.playStreamPromise !== null)
        //    return this.playStreamPromise.then(() => this.playStream(streamUrl)); 
        
        var playerFactory = new KurentoPlayerFactory(this.logger, streamUrl);
        return this.playStreamPromise = this.hub.ensureConnection()
            .then(() => this.authenticate())
            .then(c =>
                /*this.getSdpOffer(playerFactory)
                    .then(sdpOffer => {
                            this.logger.log('Got SdpOffer: ' + sdpOffer.substr(0, 20) + '...');
                            return this.hub.connectToStream(c, streamUrl, sdpOffer);
                        }))*/
                new Promise<Protocol.IConnectToStreamResponse>(resolve => {
                    this.getSdpOfferCb(playerFactory, sdpOffer => {
                            this.logger.log('Got SdpOffer: ' + sdpOffer.substr(0, 20) + '...');
                            resolve(this.hub.connectToStream(c, streamUrl, sdpOffer));
                        });
                }))
            .then(response => {
                this.logger.log('Got SdpAnswer: ' + response.sdpAnswer.substr(0, 20) + '...');
                playerFactory.setSdpAnswer(response.sdpAnswer);
                return new Promise((resolve, reject) => {
                    playerFactory.webRtcPeer.processSdpAnswer(response.sdpAnswer, () => {
                        this.logger.info('SdpAnswer processed');
                        var player = playerFactory.createPlayer();
                        this.players.push(player);
                        this.playStreamPromise = null;
                        resolve(player);
                    });
                });
            });
    }
    private playStreamPromise: Promise<KurentoPlayer> = null;

    private getSdpOffer(playerFactory: KurentoPlayerFactory): Promise<string> {
        if (this.sdpOfferPromise !== null)
            return this.sdpOfferPromise.then(() => this.getSdpOffer(playerFactory));
        
        return this.sdpOfferPromise = new Promise((resolve, reject) => {
            playerFactory.webRtcPeer = kurentoUtils.WebRtcPeer.startRecvOnly(<any>{}, function(sdpOffer) {
                playerFactory.setSdpOffer(sdpOffer);
                this.sdpOfferPromise = null;
                resolve(sdpOffer);
            });
        });
    }
    private sdpOfferPromise: Promise<string> = null;

    private getSdpOfferCb(playerFactory: KurentoPlayerFactory, callback: (sdpOffer: string) => void): void {
        playerFactory.webRtcPeer = kurentoUtils.WebRtcPeer.startRecvOnly(<any>{});
        playerFactory.webRtcPeer.onsdpoffer = sdpOffer => {
            debugger;
            callback(sdpOffer);
        };
        playerFactory.webRtcPeer.onerror = err => {
            debugger;
            this.logger.error(err);
        }
    }

    public dispose(): void {
        this.hub.stop();
    }

    private authenticate(): Promise<Protocol.IClientId> {
        return this.hub.getVersion()
            .then(version =>
                this.retrieveCredentials()
                    .then(c => {
                        var res: Promise<Protocol.IClientId>;
                        if (c && c.clientId && version.capabilities.authorization) {
                            this.logger.log('Already authorized as ' + c.clientId);
                            res = Promise.resolve(c);
                        } else {
                            if (!version.capabilities.authorization)
                                this.logger.log('KurentoHub does not support authorization. Registering...');
                            else
                                this.logger.log('Not authorized yet. Registering...');
                            res = this.hub.register();
                            res.then(c => this.saveCredentials(c));
                            res.then(cc => this.logger.log('Successfully registered as ' + cc.clientId),
                                err => this.logger.error('Failed to register.' + err));
                        }
                        return res;
                    }));
    }

    retrieveCredentials(): Promise<Protocol.IClientId> {
        var str = localStorage.getItem(KurentoVideoConsumer.credentialsKey),
            res = <Protocol.IClientId>JSON.parse(str);
        return Promise.resolve(res);
    }

    saveCredentials(credentials: Protocol.IClientId): Promise<void> {
        var str = JSON.stringify(credentials);
        localStorage.setItem(KurentoVideoConsumer.credentialsKey, str);
        return <any>Promise.resolve();
    }

    private static credentialsKey: string = 'KurentoHubClientCredentials';

    public static crossbarConfig = {
        "type": "web",
        "endpoint": {
            "type": "tcp",
            "port": 8080
        },
        "paths": {
            "/": {
                "type": "static",
                "directory": "../web"
            },
            "ws": {
                "type": "websocket"
            },
            "kurentoHub": {
                "type": "websocket",
                "auth": {
                    "wampcra": {
                        "type": "static",
                        "users": {
                            "KurentoHub": {
                                "secret": "secret2",
                                "role": "KurentoHub"
                            },
                            "VideoConsumer": {
                                "secret": "prq7+YkJ1/KlW1X0YczMHw==",
                                "role": "VideoConsumer",
                                "salt": "salt123",
                                "iterations": 100,
                                "keylen": 16
                            }
                        }
                    }
                }
            }
        }
    };

}

class KurentoPlayerFactory {

    constructor(private logger: Console, public streamUrl) {

    }

    public createPlayer(): KurentoPlayer {
        return new KurentoPlayer(this.streamUrl, this.webRtcPeer);
    }

    public webRtcPeer: Kurento.Utils.IWebRtcPeer = null;

    public setSdpOffer(value: string): void {
        if (this.sdpOffer !== null)
            this.logger.warn('[KurentoPlayerFactory.setSdpOffer()] SdpOffer has already been set.');
        else
            this.sdpOffer = value;
    }
    private sdpOffer: string = null;

    public setSdpAnswer(value: string): void {
        if (this.sdpAnswer !== null)
            this.logger.warn('[KurentoPlayerFactory.setSdpAnswer()] SdpAnswer has already been set.');
        else
            this.sdpAnswer = value;
    }
    private sdpAnswer: string = null;

}

export = KurentoVideoConsumer;