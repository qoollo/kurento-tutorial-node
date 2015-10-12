var WampCraSaltedCredentials = require('../../server/WampCraSaltedCredentials');
var WampRouterConnectionManager = require('../../server/WampRouterConnectionManager');
var WampWebTransportConfiguration = require('../../server/Wamp/Transport/WampWebTransportConfiguration');
var KurentoHubClient = (function () {
    function KurentoHubClient(config, kurentoHubDomain, logger) {
        if (logger === void 0) { logger = console; }
        var transportConfig = new WampWebTransportConfiguration(config), url = transportConfig.getUrl(kurentoHubDomain, 'kurentoHub'), credentials = new WampCraSaltedCredentials('VideoConsumer', 'secret1', 'salt123', 100, 16);
        this.connectionManager = new WampRouterConnectionManager(url, 'AquaMedKurentoInteraction', credentials, logger);
    }
    KurentoHubClient.prototype.start = function () {
        return this.connectionManager.start()
            .then(function (s) {
            debugger;
        });
    };
    KurentoHubClient.prototype.stop = function () {
        return this.connectionManager.stop();
    };
    return KurentoHubClient;
})();
module.exports = KurentoHubClient;

//# sourceMappingURL=KurentoHubClient.js.map
