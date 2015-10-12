
import logger = require('./Logger');
import autobahn = require('autobahn');
import CrossbarConfig = require('./CrossbarConfig');
import WampCredentials = require('./WampCredentials');
import WampCraCredentials = require('./WampCraCredentials');

class WampRouterConnectionManager {

    private url: string;
    private realm: string;
    private credentials: WampCredentials;

    private connectionState: ConnectionState;
    private connection: autobahn.Connection = null;
    private session: autobahn.Session = null;

    constructor(url: string, realm: string, credentials: WampCredentials) {
        this.url = url;
        this.realm = realm;
        this.credentials = credentials;
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
        var connectionOptions: autobahn.IConnectionOptions = this.credentials.setupAuth({
            url: this.url,
            realm: this.realm,
        }),
            connection = new autobahn.Connection(connectionOptions);
        return Promise.resolve(connection);
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

export = WampRouterConnectionManager;