
import WampListeningEndpoint = require('./WampListeningEndpoint');
import WampEndpointPath = require('./WampEndpointPath');
import WampStaticEndpointPath = require('./WampStaticEndpointPath');
import WampWebSocketEndpointPath = require('./WampWebSocketEndpointPath');

class WampWebTransportConfiguration {

    constructor(config: crossbar.config.IWebTransport) {
        this.endpoint = new WampListeningEndpoint(config.endpoint.port);
        for (var f in config.paths) {
            var p = config.paths[f],
                path: WampEndpointPath;
            if (p.type == 'static')
                path = new WampStaticEndpointPath(f, p.directory);
            else if (p.type == 'websocket')
                path = new WampWebSocketEndpointPath(f);
            this.paths.push(path);
        }
    }

    get type(): string {
        return 'web';
    }

    endpoint: WampListeningEndpoint;

    paths: WampEndpointPath[] = [];

    public getUrl(domain: string, path: string): string {
        var p = this.paths.filter(e => e.path == path)[0],
            pathStr = p.path == '/' ? '' : p.path,
            scheme: string;

        if (!p)
            throw new Error('Path "' + path + '" not found in WampWebTransportConfiguration.');

        if (p instanceof WampStaticEndpointPath)
            scheme = 'http';
        else if (p instanceof WampWebSocketEndpointPath)
            scheme = 'ws';
        else
            throw new Error('Unknown WampEndpointPath constructor.');

        return scheme + '://' + domain + ':' + this.endpoint.port + '/' + pathStr;
    }
}

export = WampWebTransportConfiguration;