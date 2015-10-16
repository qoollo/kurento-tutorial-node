
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

    public playStream(streamUrl: string): Promise<KurentoPlayer> {
        var promise: Promise<any>;
        if (this.hub.state == ConnectionState.NotCreated) {
            promise = this.hub.start();
        } else
            promise = Promise.resolve();
        return promise
            .then(() => this.authenticate())
            .then(c => {
                this.logger.log('Ready to start stream');
                return new KurentoPlayer('');
            });
    }

    public dispose(): void {
        this.hub.stop();
    }
    
    private authenticate(): Promise<Protocol.IClientId> {
        return this.retrieveCredentials()
            .then(c => {
                var res: Promise<Protocol.IClientId>;
                if (c && c.clientId) {
                    this.logger.log('Already authorized as ' + c.clientId);
                    res = Promise.resolve(c);
                } else {
                    this.logger.log('Not authorized yet. Registering...');
                    res = this.hub.register();
                    res.then(c => this.saveCredentials(c));
                    res.then(cc => this.logger.log('Successfully registered as ' + cc.clientId),
                        err => this.logger.error('Failed to register.' + err));
                }
                return res;                
            })
    }
    
    retrieveCredentials(): Promise<Protocol.IClientId> {
        var str = localStorage.getItem(KurentoVideoConsumer.credentialsKey),
            res = <Protocol.IClientId>JSON.parse(str);
        return Promise.resolve(res);
    }
    
    saveCredentials(credentials: Protocol.IClientId): Promise<void> {
        var str = JSON.stringify(credentials);
        localStorage.setItem(KurentoVideoConsumer.credentialsKey, str);
        return Promise.resolve();
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