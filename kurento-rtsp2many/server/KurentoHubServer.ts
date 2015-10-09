
import http = require('http');
//import ws = require('ws');
import logger = require('./Logger');
import autobahn = require('autobahn');
import CrossbarConfig = require('./CrossbarConfig');


class KurentoHubServer {

    private connectionState: ConnectionState;
    private connection: autobahn.Connection = null;
    private session: autobahn.Session = null;

    constructor() {
        this.connectionState = ConnectionState.NotCreated;
    }

    start(): Promise<void> {
        if (this.connectionState === ConnectionState.Connecting || this.connectionState === ConnectionState.Connected) {
            var err = 'KurentoHubServer.start() cannot be called while KurentoHubServer is started.';
            logger.error(err);
            throw new Error(err);
        }

        return this.createConnection()
            .then(c => {
                this.connection = c;
                return this.openConnection(c);
            });
    }

    private onConnectionOpened(session: autobahn.Session, details: any): void {
        logger.info('Connection #%d opened.', session.id);
        this.session = session;
        this.connectionState = ConnectionState.Connected;
    }

    private onConnectionClosed(reason: string, details: any): boolean {
        logger.info('Connection to WAMP Router closed. Reason:', reason);
        this.connectionState = ConnectionState.Disconnected;
        return false;
    }

    private createConnection(): Promise<autobahn.Connection> {
        return new CrossbarConfig().read().then(cfg => {
            var port = '8080',  //  TODO extract port from cfg
                path = 'kurentoHub', //  TODO extract path from cfg
                connection = new autobahn.Connection({
                    url: 'ws://127.0.0.1:' + port + '/' + path,
                    realm: 'AquaMedKurentoInteraction'
                });

            return connection;
        });
    }

    private openConnection(connection: autobahn.Connection): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            connection.onopen = (s, d) => {
                this.onConnectionOpened(s, d);
                resolve();
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