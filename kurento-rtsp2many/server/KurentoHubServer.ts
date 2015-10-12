
import logger = require('./Logger');
import autobahn = require('autobahn');
import CrossbarConfig = require('./CrossbarConfig');
import WampWebTransportConfiguration = require('./Wamp/Transport/WampWebTransportConfiguration');
import WampRouterConnectionManager = require('./WampRouterConnectionManager');
import WampCredentials = require('./WampCredentials');
import WampCraCredentials = require('./WampCraCredentials');


class KurentoHubServer {

    private connectionManager: WampRouterConnectionManager;

    constructor() {
    }

    start(): Promise<void> {
        return new CrossbarConfig()
            .getKurentoHubUrl()
            .then(url => this.connectionManager = new WampRouterConnectionManager(url, 'AquaMedKurentoInteraction', new WampCraCredentials('KurentoHub', 'secret2'), logger))
            .then(m => m.start())
            .then(s => this.registerRpcs(s))
            .then(registrations => {
                debugger;
            });
    }

    stop(): Promise<void> {
        return this.connectionManager.stop();
    }

    private registerRpcs(session: autobahn.Session): Promise<autobahn.IRegistration[]> {
        var res = Promise.all([
            session.register('com.kurentoHub.register', (args, kwargs) => this.register())
        ]);
        res.then(registrations => 
            registrations.forEach(r => logger.debug('KurentoHubServer RPC registered: ' + r.procedure)));
        res.catch(err => {
            logger.error('KurentoHubServer Failed to register RPCs.', err);
            Promise.reject(err);
        });
        return res;
    }

    register(): Promise<number> {
        return Promise.resolve(1);
    }

    //connectToStream(streamUrl: string, sdpOffer: string)
}

export = KurentoHubServer