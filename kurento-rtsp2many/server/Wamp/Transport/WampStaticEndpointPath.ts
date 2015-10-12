
import WampEndpointPath = require('./WampEndpointPath');

class WampStaticEndpointPath extends WampEndpointPath {

    constructor(path: string, directory: string) {
        super('static', path);
        this.directory = directory;
    }

    directory: string;
}

export = WampStaticEndpointPath