var ConnectionState = require('../../server/ConnectionState');
var KurentoClientHub = require('./KurentoHubClient');
var KurentoPlayer = require('./KurentoPlayer');
var KurentoVideoConsumer = (function () {
    function KurentoVideoConsumer(kurentoHubDomain, logger) {
        if (logger === void 0) { logger = console; }
        this.hub = null;
        this.logger = logger;
        this.hub = new KurentoClientHub(KurentoVideoConsumer.crossbarConfig, kurentoHubDomain, logger);
    }
    KurentoVideoConsumer.prototype.playStream = function (streamUrl) {
        var _this = this;
        var promise;
        if (this.hub.state == ConnectionState.NotCreated) {
            promise = this.hub.start();
        }
        else
            promise = Promise.resolve();
        return promise.then(function () {
            _this.hub.register().then(function (r) {
                debugger;
                _this.logger.log('RPC "register" response: ' + r);
            });
            return new KurentoPlayer('');
        });
    };
    KurentoVideoConsumer.prototype.dispose = function () {
        this.hub.stop();
    };
    KurentoVideoConsumer.crossbarConfig = {
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
    return KurentoVideoConsumer;
})();
module.exports = KurentoVideoConsumer;

//# sourceMappingURL=KurentoVideoConsumer.js.map
