
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
    private webRtcPeer: Kurento.Utils.IWebRtcPeer = null;
    private sdpOffer: Promise<string> = null;

    public playStream(streamUrl: string): Promise<KurentoPlayer> {
        var promise: Promise<any>;
        if (this.hub.state == ConnectionState.NotCreated) {
            promise = this.hub.start();
        } else
            promise = Promise.resolve();
        return promise
            .then(() => this.authenticate())
            .then(c =>
                this.getSdpOffer()
                    .then(sdpOffer => {
                        this.logger.log('Got SdpOffer: ' + sdpOffer.substr(0, 20) + '...');
                        return this.hub.connectToStream(c, streamUrl, sdpOffer);
                    }))
            .then(response => {
                this.logger.log('Got SdpAnswer: ' + response.sdpAnswer.substr(0, 20) + '...');
                return new KurentoPlayer('');
            });
    }

    private getSdpOffer(): Promise<string> {
        if (this.webRtcPeer === null) {
            this.sdpOffer = new Promise((resolve, reject) => {
                this.webRtcPeer = kurentoUtils.WebRtcPeer.startRecvOnly(<any>{}, function(sdpOffer) {
                    resolve(sdpOffer);
                });
            });
        }
        return this.sdpOffer;
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

    private static crossbarConfig = {
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

export = KurentoVideoConsumer;