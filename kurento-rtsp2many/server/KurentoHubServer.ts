
import http = require('http');
//import ws = require('ws');
import logger = require('./Logger');
import autobahn = require('autobahn');
import when = require('when');
import CrossbarConfig = require('./CrossbarConfig');
import WampCraCredentials = require('./WampCraCredentials');


class KurentoHubServer {

    private connectionManager: WampRouterConnectionManager;

    constructor() {
        this.connectionManager = new WampRouterConnectionManager();
    }

    start(): Promise<void> {
        return this.connectionManager.start()
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

class WampRouterConnectionManager {

    private connectionState: ConnectionState;
    private connection: autobahn.Connection = null;
    private session: autobahn.Session = null;

    constructor() {
        this.connectionState = ConnectionState.NotCreated;
    }

    start(): Promise<autobahn.Session> {
        if (this.connectionState === ConnectionState.Connecting || this.connectionState === ConnectionState.Connected) {
            var err = 'WampRouterConnectionManager.start() cannot be called while WampRouterConnectionManager is started.';
            logger.error(err);
            throw new Error(err);
        }

        return this.createConnection()
            .then(c => {
                this.connection = c;
                return this.openConnection(c);
            });
    }

    stop(): Promise<void> {
        if (this.connectionState !== ConnectionState.Connected) {
            var err = 'WampRouterConnectionManager.stop() cannot be called while WampRouterConnectionManager is not connected.';
            logger.error(err);
            throw new Error(err);
        }

        return new Promise<void>((resolve, reject) => {
            this.connection.close('Deliberate closing', 'Close please');
            var original = this.connection.onclose;
            this.connection.onclose = (r, d) => {
                resolve();
                return original(r, d);
            }
        });
    }

    private onConnectionOpened(session: autobahn.Session, details: any): void {
        logger.info('Connection to WAMP Router opened. Session id: %d', session.id);
        this.session = session;
        this.connectionState = ConnectionState.Connected;
    }

    private onConnectionClosed(reason: string, details: any): boolean {
        logger.info('Connection to WAMP Router closed. Session id: %d. Reason: ' + reason, this.session.id);
        this.connectionState = ConnectionState.Disconnected;
        this.connection = null;
        this.session = null;
        return false;
    }

    private createConnection(): Promise<autobahn.Connection> {
        return new CrossbarConfig().read().then(cfg => {
            var port = '8080',  //  TODO extract port from cfg
                path = 'kurentoHub', //  TODO extract path from cfg
                credentials = new WampCraCredentials('KurentoHub', 'secret2'),
                connectionOptions: autobahn.IConnectionOptions = credentials.setupAuth({
                    url: 'ws://127.0.0.1:' + port + '/' + path,
                    realm: 'AquaMedKurentoInteraction',
                }),
                connection = new autobahn.Connection(connectionOptions);

            return connection;
        });
    }

    private openConnection(connection: autobahn.Connection): Promise<autobahn.Session> {
        return new Promise((resolve, reject) => {
            connection.onopen = (s, d) => {
                this.onConnectionOpened(s, d);
                resolve(s);
            };
            connection.onclose = (r, d) => this.onConnectionClosed(r, d);
            connection.open();
            this.connectionState = ConnectionState.Connecting;
        });
    }
}

enum ConnectionState {
    NotCreated,
    Connecting,
    Connected,
    Disconnected
}

export = KurentoHubServer