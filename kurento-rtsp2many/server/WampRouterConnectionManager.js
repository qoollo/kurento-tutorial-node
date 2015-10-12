var autobahn = require('autobahn');
var WampRouterConnectionManager = (function () {
    function WampRouterConnectionManager(url, realm, credentials, logger) {
        this.connection = null;
        this.session = null;
        this.url = url;
        this.realm = realm;
        this.credentials = credentials;
        this.logger = logger;
        this.connectionState = ConnectionState.NotCreated;
    }
    WampRouterConnectionManager.prototype.start = function () {
        var _this = this;
        if (this.connectionState === ConnectionState.Connecting || this.connectionState === ConnectionState.Connected) {
            var err = 'WampRouterConnectionManager.start() cannot be called while WampRouterConnectionManager is started.';
            this.logger.error(err);
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
            var err = 'WampRouterConnectionManager.stop() cannot be called while WampRouterConnectionManager is not connected.';
            this.logger.error(err);
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
        this.logger.info('Connection to WAMP Router opened. Session id: %d', session.id);
        this.session = session;
        this.connectionState = ConnectionState.Connected;
    };
    WampRouterConnectionManager.prototype.onConnectionClosed = function (reason, details) {
        this.logger.info('Connection to WAMP Router closed. Session id: %d. Reason: ' + reason, this.session.id);
        this.connectionState = ConnectionState.Disconnected;
        this.connection = null;
        this.session = null;
        return false;
    };
    WampRouterConnectionManager.prototype.createConnection = function () {
        var connectionOptions = this.credentials.setupAuth({
            url: this.url,
            realm: this.realm,
        }), connection = new autobahn.Connection(connectionOptions);
        return Promise.resolve(connection);
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
module.exports = WampRouterConnectionManager;

//# sourceMappingURL=WampRouterConnectionManager.js.map
