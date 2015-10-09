//import ws = require('ws');
var logger = require('./Logger');
var autobahn = require('autobahn');
var CrossbarConfig = require('./CrossbarConfig');
var KurentoHubServer = (function () {
    function KurentoHubServer() {
        this.connection = null;
        this.session = null;
        this.connectionState = ConnectionState.NotCreated;
    }
    KurentoHubServer.prototype.start = function () {
        var _this = this;
        if (this.connectionState === ConnectionState.Connecting || this.connectionState === ConnectionState.Connected) {
            var err = 'KurentoHubServer.start() cannot be called while KurentoHubServer is started.';
            logger.error(err);
            throw new Error(err);
        }
        return this.createConnection()
            .then(function (c) {
            _this.connection = c;
            return _this.openConnection(c);
        });
    };
    KurentoHubServer.prototype.onConnectionOpened = function (session, details) {
        logger.info('Connection #%d opened.', session.id);
        this.session = session;
        this.connectionState = ConnectionState.Connected;
    };
    KurentoHubServer.prototype.onConnectionClosed = function (reason, details) {
        logger.info('Connection to WAMP Router closed. Reason:', reason);
        this.connectionState = ConnectionState.Disconnected;
        return false;
    };
    KurentoHubServer.prototype.createConnection = function () {
        return new CrossbarConfig().read().then(function (cfg) {
            var port = '8080', //  TODO extract port from cfg
            path = 'kurentoHub', //  TODO extract path from cfg
            connection = new autobahn.Connection({
                url: 'ws://127.0.0.1:' + port + '/' + path,
                realm: 'AquaMedKurentoInteraction'
            });
            return connection;
        });
    };
    KurentoHubServer.prototype.openConnection = function (connection) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            connection.onopen = function (s, d) {
                _this.onConnectionOpened(s, d);
                resolve();
            };
            connection.onclose = function (r, d) { return _this.onConnectionClosed(r, d); };
            connection.open();
            _this.connectionState = ConnectionState.Connecting;
        });
    };
    return KurentoHubServer;
})();
var ConnectionState;
(function (ConnectionState) {
    ConnectionState[ConnectionState["NotCreated"] = 0] = "NotCreated";
    ConnectionState[ConnectionState["Connecting"] = 1] = "Connecting";
    ConnectionState[ConnectionState["Connected"] = 2] = "Connected";
    ConnectionState[ConnectionState["Disconnected"] = 3] = "Disconnected";
})(ConnectionState || (ConnectionState = {}));
module.exports = KurentoHubServer;
//# sourceMappingURL=KurentoHubServer.js.map