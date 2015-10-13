var KurentoHubRpcNames = require('../../server/KurentoHubRpcNames');
var WampCraSaltedCredentials = require('../../server/WampCraSaltedCredentials');
var WampRouterConnectionManager = require('../../server/WampRouterConnectionManager');
var WampWebTransportConfiguration = require('../../server/Wamp/Transport/WampWebTransportConfiguration');
var KurentoHubClient = (function () {
    function KurentoHubClient(config, kurentoHubDomain, logger) {
        if (logger === void 0) { logger = console; }
        var transportConfig = new WampWebTransportConfiguration(config), url = transportConfig.getUrl(kurentoHubDomain, 'kurentoHub'), credentials = new WampCraSaltedCredentials('VideoConsumer', 'secret1', 'salt123', 100, 16);
        this.connectionManager = new WampRouterConnectionManager(url, 'AquaMedKurentoInteraction', credentials, logger);
        this.logger = logger;
    }
    KurentoHubClient.prototype.start = function () {
        var _this = this;
        return this.connectionManager.start()
            .then(function (s) { return _this.logger.info('Connection to KurentoHub established successfully. Session #' + s.id); })
            .catch(function (err) {
            var msg = 'Failed to establish connection with KurentoHub. ' + (err.message || err);
            _this.logger.log(msg);
            return Promise.reject(msg);
        });
    };
    KurentoHubClient.prototype.stop = function () {
        return this.connectionManager.stop();
    };
    Object.defineProperty(KurentoHubClient.prototype, "state", {
        get: function () {
            return this.connectionManager.state;
        },
        enumerable: true,
        configurable: true
    });
    KurentoHubClient.prototype.register = function () {
        return this.handleRpcError(this.connectionManager.session.call(KurentoHubRpcNames.register));
    };
    KurentoHubClient.prototype.connectToStream = function (streamUrl, sdpOffer) {
        return this.handleRpcError(this.connectionManager.session.call(KurentoHubRpcNames.connectToStream, [streamUrl, sdpOffer]));
    };
    KurentoHubClient.prototype.handleRpcError = function (rpcPromise) {
        var _this = this;
        return rpcPromise
            .catch(function (e) {
            var err = 'Error calling RPC: ' + (e.error || '') + ' ' + (e.args && e.args[0]);
            _this.logger.error(err);
            return Promise.reject(err);
        });
    };
    return KurentoHubClient;
})();
module.exports = KurentoHubClient;
//# sourceMappingURL=KurentoHubClient.js.map