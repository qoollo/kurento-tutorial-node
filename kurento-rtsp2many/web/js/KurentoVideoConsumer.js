var ConnectionState = require('../../server/ConnectionState');
var KurentoHubClient = require('./KurentoHubClient');
var KurentoPlayer = require('./KurentoPlayer');
var KurentoVideoConsumer = (function () {
    function KurentoVideoConsumer(kurentoHubDomain, logger) {
        if (logger === void 0) { logger = console; }
        this.hub = null;
        this.logger = logger;
        this.hub = new KurentoHubClient(KurentoVideoConsumer.crossbarConfig, kurentoHubDomain, logger);
    }
    KurentoVideoConsumer.prototype.playStream = function (streamUrl) {
        var _this = this;
        var promise;
        if (this.hub.state == ConnectionState.NotCreated) {
            promise = this.hub.start();
        }
        else
            promise = Promise.resolve();
        return promise
            .then(function () { return _this.authenticate(); })
            .then(function (c) {
            _this.logger.log('Ready to start stream');
            return new KurentoPlayer('');
        });
    };
    KurentoVideoConsumer.prototype.dispose = function () {
        this.hub.stop();
    };
    KurentoVideoConsumer.prototype.authenticate = function () {
        var _this = this;
        return this.retrieveCredentials()
            .then(function (c) {
            var res;
            if (c && c.clientId) {
                _this.logger.log('Already authorized as ' + c.clientId);
                res = Promise.resolve(c);
            }
            else {
                _this.logger.log('Not authorized yet. Registering...');
                res = _this.hub.register();
                res.then(function (cc) { return _this.logger.log('Successfully registered as ' + cc.clientId); }, function (err) { return _this.logger.error('Failed to register.' + err); });
            }
            return res;
        });
    };
    KurentoVideoConsumer.prototype.retrieveCredentials = function () {
        var str = localStorage.getItem(KurentoVideoConsumer.credentialsKey), res = JSON.parse(str);
        return Promise.resolve(res);
    };
    KurentoVideoConsumer.credentialsKey = 'KurentoHubClientCredentials';
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
