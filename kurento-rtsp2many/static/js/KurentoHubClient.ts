
import WampCraSaltedCredentials = require('../../server/WampCraSaltedCredentials');
import WampRouterConnectionManager = require('../../server/WampRouterConnectionManager');
import WampWebTransportConfiguration = require('../../server/Wamp/Transport/WampWebTransportConfiguration');

class KurentoHubClient {

    private connectionManager: WampRouterConnectionManager;

    constructor(config: crossbar.config.IWebTransport, kurentoHubDomain: string) {
        var transportConfig = new WampWebTransportConfiguration(config),
            url = transportConfig.getUrl(kurentoHubDomain, 'kurentoHub'),
            credentials = new WampCraSaltedCredentials('VideoConsumer', 'prq7+YkJ1/KlW1X0YczMHw==', 'salt123', 100, 16);
        this.connectionManager = new WampRouterConnectionManager(url, 'AquaMedKurentoInteraction', credentials);
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