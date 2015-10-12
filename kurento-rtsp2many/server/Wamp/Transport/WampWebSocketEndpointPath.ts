
import WampEndpointPath = require('./WampEndpointPath');

class WampWebSocketEndpointPath extends WampEndpointPath {

    constructor(path: string) {
        super('websocket', path);
    }

}

export = WampWebSocketEndpointPath