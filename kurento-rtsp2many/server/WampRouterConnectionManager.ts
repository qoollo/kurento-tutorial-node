
import autobahn = require('autobahn');
import ConnectionState = require('./ConnectionState');
import WampCredentials = require('./WampCredentials');
import WampCraCredentials = require('./WampCraCredentials');

class WampRouterConnectionManager {

    private url: string;
    private realm: string;
    private credentials: WampCredentials;

    private logger: Console;

    private connectionState: ConnectionState;
    private connection: autobahn.Connection = null;
    private _session: autobahn.Session = null;

    private static closeReason: string = 'Deliberate closing';

    constructor(url: string, realm: string, credentials: WampCredentials, logger) {
        this.url = url;
        this.realm = realm;
        this.credentials = credentials;

        this.logger = logger;

        this.connectionState = ConnectionState.NotCreated;
    }

    start(): Promise<autobahn.Session> {
        if (this.connectionState === ConnectionState.Connecting || this.connectionState === ConnectionState.Connected) {
            var err = 'WampRouterConnectionManager.start() cannot be called while WampRouterConnectionManager is started.';
            this.logger.error(err);
            throw new Error(err);
        }

        return this.createConnection()
            .then(c => {
                this.connection = c;
                return this.openConnection(c);
            })
            .then(s => this.subscribeSessionEvents(s))
            .catch(e => {
                var msg = 'Failed to open WAMP Router connection: ' + (e.message || e);
                this.logger.error(msg);
                return Promise.reject(msg);
            });
    }

    stop(): Promise<void> {
        if (this.connectionState !== ConnectionState.Connected) {
            var err = 'WampRouterConnectionManager.stop() cannot be called while WampRouterConnectionManager is not connected.';
            this.logger.error(err);
            throw new Error(err);
        }

        return new Promise<void>((resolve, reject) => {
            this.connection.close(WampRouterConnectionManager.closeReason, 'Close please');
            var original = this.connection.onclose;
            this.connection.onclose = (r, d) => {
                resolve();
                return original(r, d);
            }
        });
    }

    public get state(): ConnectionState {
        return this.connectionState;
    }

    public get session(): autobahn.Session {
        return this._session;
    }

    private onConnectionOpened(session: autobahn.Session, details: any): void {
        this.logger.info('Connection to WAMP Router opened. Session id: %d', session.id);
        this._session = session;
        this.connectionState = ConnectionState.Connected;
    }

    private onConnectionClosed(reason: string, details: any): boolean {
        this.logger.info('Connection to WAMP Router closed. Session id: %d. Reason: ' + reason, this._session.id);
        this.connectionState = ConnectionState.Disconnected;
        this.connection = null;
        this._session = null;
        return reason == WampRouterConnectionManager.closeReason;
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

    private subscribeSessionEvents(session: autobahn.Session): autobahn.Session {
        session.onjoin = f => this.onNodeJoined(f);
        session.onleave = (r, d) => this.onNodeLeft(r, d);
        return session;
    }

    private onNodeJoined(roleFeatures: any): void {
        this.logger.info('WAMP Session event: join.', roleFeatures);
    }

    private onNodeLeft(reason: string, details: any): void {
        this.logger.info('WAMP Session event: leave. Reason: ' + reason + '. Details: ', details);
    }
}

export = WampRouterConnectionManager;