
import WampCraSaltedCredentials = require('../../server/WampCraSaltedCredentials');
import WampRouterConnectionManager = require('../../server/WampRouterConnectionManager');
import WampWebTransportConfiguration = require('../../server/Wamp/Transport/WampWebTransportConfiguration');

class KurentoHubClient {

    private connectionManager: WampRouterConnectionManager;

    constructor(config: crossbar.config.IWebTransport, kurentoHubDomain: string, logger = console) {
        var transportConfig = new WampWebTransportConfiguration(config),
            url = transportConfig.getUrl(kurentoHubDomain, 'kurentoHub'),
            credentials = new WampCraSaltedCredentials('VideoConsumer', 'secret1', 'salt123', 100, 16);
        this.connectionManager = new WampRouterConnectionManager(url, 'AquaMedKurentoInteraction', credentials, logger);
    }

    start(): Promise<void> {
        return this.connectionManager.start()
            .then(s => {
                debugger;
            });
    }

    stop(): Promise<void> {
        return this.connectionManager.stop();
    }

}

export = KurentoHubClient;