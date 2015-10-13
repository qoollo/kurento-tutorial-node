var logger = require('./Logger');
var KurentoHubRpcNames = require('./KurentoHubRpcNames');
var CrossbarConfig = require('./CrossbarConfig');
var WampRouterConnectionManager = require('./WampRouterConnectionManager');
var WampCraCredentials = require('./WampCraCredentials');
var KurentoHubServer = (function () {
    function KurentoHubServer() {
    }
    KurentoHubServer.prototype.start = function () {
        var _this = this;
        return new CrossbarConfig()
            .getKurentoHubUrl()
            .then(function (url) { return _this.connectionManager = new WampRouterConnectionManager(url, 'AquaMedKurentoInteraction', new WampCraCredentials('KurentoHub', 'secret2'), logger); })
            .then(function (m) { return m.start(); })
            .then(function (s) { return _this.registerRpcs(s); })
            .then(function (registrations) {
            debugger;
        });
    };
    KurentoHubServer.prototype.stop = function () {
        return this.connectionManager.stop();
    };
    Object.defineProperty(KurentoHubServer.prototype, "state", {
        get: function () {
            return this.connectionManager.state;
        },
        enumerable: true,
        configurable: true
    });
    KurentoHubServer.prototype.registerRpcs = function (session) {
        var _this = this;
        var res = Promise.all([
            session.register(KurentoHubRpcNames.register, function (args, kwargs) { return _this.register(); })
        ]);
        res.then(function (registrations) {
            return registrations.forEach(function (r) { return logger.debug('KurentoHubServer RPC registered: ' + r.procedure); });
        });
        res.catch(function (err) {
            logger.error('KurentoHubServer Failed to register RPCs.', err);
            Promise.reject(err);
        });
        return res;
    };
    KurentoHubServer.prototype.register = function () {
        return Promise.resolve(1);
    };
    return KurentoHubServer;
})();
module.exports = KurentoHubServer;

//# sourceMappingURL=KurentoHubServer.js.map
