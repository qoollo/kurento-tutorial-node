
class WampListeningEndpoint {

    constructor(port: number) {
        this._port = port;
    }

    get type(): string {
        return 'tcp';
    }

    get port(): number {
        return this._port;
    }
    private _port: number;

    public version: string = '4';

    /**
     * optional interface to listen on, e.g. 127.0.0.1 to only listen on IPv4 loopback or ::1 to only listen on IPv6 loopback.
     */
    public interfaceToListen: string;

    /**
     * optional accept queue depth of listening endpoints (default: 50)
     */
    backlog: number = 50;

    /**
     * flag which controls sharing the socket between multiple workers - this currently only works on Linux >= 3.9 (default: false)
     */
    shared: boolean = false;

    /**
     * optional endpoint TLS configuration. See http://crossbar.io/docs/Transport-Endpoints/
     */
    tls: Object;
}

export = WampListeningEndpoint;