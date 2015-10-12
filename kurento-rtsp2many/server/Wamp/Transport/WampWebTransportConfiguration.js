var WampListeningEndpoint = require('./WampListeningEndpoint');
var WampStaticEndpointPath = require('./WampStaticEndpointPath');
var WampWebSocketEndpointPath = require('./WampWebSocketEndpointPath');
var WampWebTransportConfiguration = (function () {
    function WampWebTransportConfiguration(config) {
        this.paths = [];
        this.endpoint = new WampListeningEndpoint(config.endpoint.port);
        for (var f in config.paths) {
            var p = config.paths[f], path;
            if (p.type == 'static')
                path = new WampStaticEndpointPath(f, p.directory);
            else if (p.type == 'websocket')
                path = new WampWebSocketEndpointPath(f);
            this.paths.push(path);
        }
    }
    Object.defineProperty(WampWebTransportConfiguration.prototype, "type", {
        get: function () {
            return 'web';
        },
        enumerable: true,
        configurable: true
    });
    WampWebTransportConfiguration.prototype.getUrl = function (domain, path) {
        var p = this.paths.filter(function (e) { return e.path == path; })[0], pathStr = p.path == '/' ? '' : p.path, scheme;
        if (!p)
            throw new Error('Path "' + path + '" not found in WampWebTransportConfiguration.');
        if (p instanceof WampStaticEndpointPath)
            scheme = 'http';
        else if (p instanceof WampWebSocketEndpointPath)
            scheme = 'ws';
        else
            throw new Error('Unknown WampEndpointPath constructor.');
        return scheme + '://' + domain + ':' + this.endpoint.port + '/' + pathStr;
    };
    return WampWebTransportConfiguration;
})();
module.exports = WampWebTransportConfiguration;
//# sourceMappingURL=WampWebTransportConfiguration.js.map