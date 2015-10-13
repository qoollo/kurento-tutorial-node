var IdCounter = require('./IdCounter');
var KurentoClientManager = (function () {
    function KurentoClientManager(kurentoClient) {
        this.kurentoClient = kurentoClient;
        this.wsUri = 'ws://10.5.6.119:8888/kurento';
        this.clientCounter = new IdCounter();
        this.clients = [];
    }
    KurentoClientManager.prototype.addClient = function (wsUri, callback) {
        var _this = this;
        var existingClient = this.clients.filter(function (c) { return c.uri === wsUri; })[0];
        if (existingClient)
            callback('The client with the specified Uri already exists');
        else {
            console.log('Connecting to Kurento Media Server at', wsUri);
            new this.kurentoClient(wsUri, function (error, kurentoClient) {
                if (error)
                    return callback(error);
                var innerKurrentoClient = new KurentoClientWrapper(_this.clientCounter.nextUniqueId, wsUri, kurentoClient);
                _this.clients.push(innerKurrentoClient);
                callback(null, innerKurrentoClient);
            });
        }
    };
    KurentoClientManager.prototype.findOrCreateClient = function (callback) {
        var _this = this;
        var client = this.clients.filter(function (c) { return c.uri == _this.wsUri; })[0];
        if (client)
            return callback(client);
        this.addClient(this.wsUri, callback);
    };
    KurentoClientManager.prototype.getClientById = function (id) {
        return this.clients.filter(function (c) { return c.id === id; })[0];
    };
    KurentoClientManager.prototype.findAvailableClient = function () {
        return this.clients.sort(function (a, b) { return a.connectionCounter.getConnectionCount() - b.connectionCounter.getConnectionCount(); })[0];
    };
    KurentoClientManager.prototype.removeClientById = function (id) {
        var client = this.getClientById(id), index = this.clients.indexOf(client);
        if (index !== -1)
            this.clients.splice(index, 1);
    };
    return KurentoClientManager;
})();
var KurentoClientWrapper = (function () {
    function KurentoClientWrapper(id, uri, client) {
        var _this = this;
        //  It means connection from current app:
        this.masterConnectionCount = 0;
        this.viewerConnectionCount = 0;
        this.connectionCounter = {
            processMasterConnected: function () { return _this.masterConnectionCount++; },
            processMasterDisconnected: function () { return _this.masterConnectionCount--; },
            processVieverConnected: function () { return _this.viewerConnectionCount++; },
            processVieverDisconected: function () { return _this.viewerConnectionCount--; },
            getConnectionCount: function () { return (_this.masterConnectionCount + _this.viewerConnectionCount); }
        };
        this._id = id;
        this._uri = uri;
        this._client = client;
    }
    Object.defineProperty(KurentoClientWrapper.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(KurentoClientWrapper.prototype, "uri", {
        get: function () {
            return this._uri;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(KurentoClientWrapper.prototype, "client", {
        get: function () {
            return this._client;
        },
        enumerable: true,
        configurable: true
    });
    return KurentoClientWrapper;
})();
module.exports = KurentoClientManager;
//# sourceMappingURL=KurentoClientManager.js.map