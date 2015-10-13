/// <reference path="Protocol/RpcResponses.d.ts" />
var logger = require('./Logger');
var KurentoHubRpcNames = require('./KurentoHubRpcNames');
var CrossbarConfig = require('./CrossbarConfig');
var WampRouterConnectionManager = require('./WampRouterConnectionManager');
var WampCraCredentials = require('./WampCraCredentials');
var MasterManager = require('./MasterManager');
var Master = require('./Master');
var ViewerManager = require('./ViewerManager');
var KurentoClient = require('kurento-client');
var KurentoClientManager = require('./KurentoClientManager');
var KurentoHubServer = (function () {
    function KurentoHubServer() {
        this.masterManager = new MasterManager();
        this.viewerManager = new ViewerManager();
        this.kurentoClientManager = new KurentoClientManager(KurentoClient);
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
            session.register(KurentoHubRpcNames.register, function (args, kwargs) { return _this.register(); }),
            session.register(KurentoHubRpcNames.connectToStream, function (args, kwargs) { return _this.connectToStream(args[0], args[1]); })
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
        return Promise.resolve({
            clientId: 1
        });
    };
    KurentoHubServer.prototype.connectToStream = function (streamUrl, sdpOffer) {
        var _this = this;
        return this.addMasterIfNotExists(streamUrl)
            .then(function (m) { return _this.processAddViewer(1, m, streamUrl, sdpOffer); });
    };
    KurentoHubServer.prototype.addMasterIfNotExists = function (streamUrl) {
        var master = this.masterManager.getMasterByStreamUrl(streamUrl);
        if (!master)
            master = this.masterManager.addMaster(new Master(null, streamUrl, null, this.kurentoClientManager));
        return Promise.resolve(master);
    };
    KurentoHubServer.prototype.processAddViewer = function (sessionId, master, streamUrl, sdpOffer) {
        var viewer = this.viewerManager.getViewerBySessionId(sessionId);
        if (!viewer)
            viewer = this.viewerManager.addViewer(new Viewer(sessionId, streamUrl, sdpOffer));
        return new Promise(function (resolve, reject) {
            master.addViewer(viewer, function (err, sdpAnswer) {
                if (err)
                    reject(logger.error('Failed to add Viewer to Master.', sdpAnswer));
                logger.info('Added Viewer to Master. SdpAnswer:', sdpAnswer);
                resolve({
                    streamUrl: streamUrl,
                    sdpAnswer: sdpAnswer
                });
            });
        });
    };
    return KurentoHubServer;
})();
module.exports = KurentoHubServer;

//# sourceMappingURL=KurentoHubServer.js.map
