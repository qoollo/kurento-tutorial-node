var autobahn = require('autobahn');
var ConnectionState = require('./ConnectionState');
var WampRouterConnectionManager = (function () {
    function WampRouterConnectionManager(url, realm, credentials, logger) {
        this.connection = null;
        this._session = null;
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
        })
            .then(function (s) { return _this.subscribeSessionEvents(s); })
            .catch(function (e) {
            var msg = 'Failed to open WAMP Router connection: ' + (e.message || e);
            _this.logger.error(msg);
            return Promise.reject(msg);
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
            _this.connection.close(WampRouterConnectionManager.closeReason, 'Close please');
            var original = _this.connection.onclose;
            _this.connection.onclose = function (r, d) {
                resolve();
                return original(r, d);
            };
        });
    };
    Object.defineProperty(WampRouterConnectionManager.prototype, "state", {
        get: function () {
            return this.connectionState;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WampRouterConnectionManager.prototype, "session", {
        get: function () {
            return this._session;
        },
        enumerable: true,
        configurable: true
    });
    WampRouterConnectionManager.prototype.onConnectionOpened = function (session, details) {
        this.logger.info('Connection to WAMP Router opened. Session id: %d', session.id);
        this._session = session;
        this.connectionState = ConnectionState.Connected;
    };
    WampRouterConnectionManager.prototype.onConnectionClosed = function (reason, details) {
        this.logger.info('Connection to WAMP Router closed. Session id: %d. Reason: ' + reason, this._session.id);
        this.connectionState = ConnectionState.Disconnected;
        this.connection = null;
        this._session = null;
        return reason == WampRouterConnectionManager.closeReason;
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
    WampRouterConnectionManager.prototype.subscribeSessionEvents = function (session) {
        var _this = this;
        session.onjoin = function (f) { return _this.onNodeJoined(f); };
        session.onleave = function (r, d) { return _this.onNodeLeft(r, d); };
        return session;
    };
    WampRouterConnectionManager.prototype.onNodeJoined = function (roleFeatures) {
        this.logger.info('WAMP Session event: join.', roleFeatures);
    };
    WampRouterConnectionManager.prototype.onNodeLeft = function (reason, details) {
        this.logger.info('WAMP Session event: leave. Reason: ' + reason + '. Details: ', details);
    };
    WampRouterConnectionManager.closeReason = 'Deliberate closing';
    return WampRouterConnectionManager;
})();
module.exports = WampRouterConnectionManager;

//# sourceMappingURL=WampRouterConnectionManager.js.map
