
import ConnectionState = require('../../server/ConnectionState');
import KurentoHubRpcNames = require('../../server/KurentoHubRpcNames');
import WampCraCredentials = require('../../server/WampCraCredentials');
import WampCraSaltedCredentials = require('../../server/WampCraSaltedCredentials');
import WampRouterConnectionManager = require('../../server/WampRouterConnectionManager');
import WampWebTransportConfiguration = require('../../server/Wamp/Transport/WampWebTransportConfiguration');

class KurentoHubClient {

    private connectionManager: WampRouterConnectionManager;
    private logger: Console;

    constructor(config: crossbar.config.IWebTransport, kurentoHubDomain: string, logger = console) {
        var transportConfig = new WampWebTransportConfiguration(config),
            url = transportConfig.getUrl(kurentoHubDomain, 'kurentoHub'),
            credentials = new WampCraSaltedCredentials('VideoConsumer', 'secret1', 'salt123', 100, 16);
        this.connectionManager = new WampRouterConnectionManager(url, 'AquaMedKurentoInteraction', credentials, logger);
        this.logger = logger;
    }

    start(): Promise<void> {
        return this.connectionManager.start()
            .then(s => this.logger.info('Connection to KurentoHub established successfully. Session #' + s.id))
            .catch(err => {
                var msg = 'Failed to establish connection with KurentoHub. ' + (err.message || err);
                this.logger.log(msg);
                return Promise.reject(msg);
            });
    }

    stop(): Promise<void> {
        return this.connectionManager.stop();
    }

    public get state(): ConnectionState {
        return this.connectionManager.state;
    } 

    public register(): Promise<number> {
        return this.handleRpcError(this.connectionManager.session.call(KurentoHubRpcNames.register));
    }

    public connectToStream(streamUrl: string, sdpOffer: string): Promise<Protocol.IConnectToStreamResponse> {
        return this.handleRpcError(this.connectionManager.session.call(KurentoHubRpcNames.connectToStream, [streamUrl, sdpOffer]));
    }

    private handleRpcError<T>(rpcPromise: Promise<T>): Promise<T> {
        return rpcPromise
            .catch(e => {
                var err = 'Error calling RPC: ' + (e.error || '') + ' ' + (e.args && e.args[0]);
                this.logger.error(err);
                return Promise.reject(err);
            });
    }

}

export = KurentoHubClient;