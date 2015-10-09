//import ws = require('ws');
var logger = require('./Logger');
var autobahn = require('autobahn');
var CrossbarConfig = require('./CrossbarConfig');
var KurentoHubServer = (function () {
    function KurentoHubServer() {
        this.connectionManager = new WampRouterConnectionManager();
    }
    KurentoHubServer.prototype.start = function () {
        var _this = this;
        return this.connectionManager.start()
            .then(function (s) { return _this.registerRpcs(s); })
            .then(function (registrations) {
            debugger;
        });
    };
    KurentoHubServer.prototype.stop = function () {
        return this.connectionManager.stop();
    };
    KurentoHubServer.prototype.registerRpcs = function (session) {
        var _this = this;
        var res = Promise.all([
            session.register('com.kurentoHub.register', function (args, kwargs) { return _this.register(); })
        ]);
        res.catch(function (err) {
            logger.error('KurentoHubServer Failed to register RPCs.', err);
            Promise.reject(err);
        });
        return res;
    };
    KurentoHubServer.prototype.register = function () {
        return 1;
    };
    return KurentoHubServer;
})();
var WampRouterConnectionManager = (function () {
    function WampRouterConnectionManager() {
        this.connection = null;
        this.session = null;
        this.connectionState = ConnectionState.NotCreated;
    }
    WampRouterConnectionManager.prototype.start = function () {
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
    WampRouterConnectionManager.prototype.stop = function () {
        var _this = this;
        if (this.connectionState !== ConnectionState.Connected) {
            var err = 'KurentoHubServer.stop() cannot be called while KurentoHubServer is not connected.';
            logger.error(err);
            throw new Error(err);
        }
        return new Promise(function (resolve, reject) {
            _this.connection.close('Deliberate closing', 'Close please');
            var original = _this.connection.onclose;
            _this.connection.onclose = function (r, d) {
                resolve();
                return original(r, d);
            };
        });
    };
    WampRouterConnectionManager.prototype.onConnectionOpened = function (session, details) {
        logger.info('Connection #%d opened.', session.id);
        this.session = session;
        this.connectionState = ConnectionState.Connected;
    };
    WampRouterConnectionManager.prototype.onConnectionClosed = function (reason, details) {
        logger.info('Connection to WAMP Router closed. Reason:', reason);
        this.connectionState = ConnectionState.Disconnected;
        this.connection = null;
        this.session = null;
        return false;
    };
    WampRouterConnectionManager.prototype.createConnection = function () {
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
    WampRouterConnectionManager.prototype.openConnection = function (connection) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            connection.onopen = function (s, d) {
                _this.onConnectionOpened(s, d);
                resolve(s);
            };
            connection.onclose = function (r, d) { return _this.onConnectionClosed(r, d); };
            connection.open();
            _this.connectionState = ConnectionState.Connecting;
        });
    };
    return WampRouterConnectionManager;
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