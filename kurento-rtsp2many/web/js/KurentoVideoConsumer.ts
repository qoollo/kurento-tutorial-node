
import ConnectionState = require('../../server/ConnectionState');
import KurentoClientHub = require('./KurentoHubClient');
import KurentoPlayer = require('./KurentoPlayer');

class KurentoVideoConsumer {

    constructor(kurentoHubDomain: string, logger: Console = console) {
        this.logger = logger;

        this.hub = new KurentoClientHub(KurentoVideoConsumer.crossbarConfig, kurentoHubDomain, logger);
    }

    private logger: Console;
    private hub: KurentoClientHub = null;

    public playStream(streamUrl: string): Promise<KurentoPlayer> {
        var promise: Promise<any>;
        if (this.hub.state == ConnectionState.NotCreated) {
            promise = this.hub.start()
        } else
            promise = Promise.resolve();
        return promise.then(() => {
            this.hub.register().then(r => {
                debugger;
                this.logger.log('RPC "register" response: ' +  r);
            });
            return new KurentoPlayer('');
        });
    }

    public dispose(): void {
        this.hub.stop();
    }

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