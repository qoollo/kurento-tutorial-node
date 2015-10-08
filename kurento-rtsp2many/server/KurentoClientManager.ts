import IdCounterModule = require('./IdCounter');
var IdCounter = IdCounterModule.IdCounter;

export class KurentoClientManager {

    constructor(private kurentoClient: Kurento.Client.IKurentoClientConstructor) {

    }

    private wsUri: string = 'ws://10.5.6.119:8888/kurento';

    private clientCounter = new IdCounter();

    private clients: KurentoClientWrapper[] = []

    addClient(wsUri: string, callback: (err, client?: KurentoClientWrapper) => void) {
        var existingClient = this.clients.filter(c => c.uri === wsUri)[0];

        if (existingClient)
            callback('The client with the specified Uri already exists');
        else {
            console.log('Connecting to Kurento Media Server at', wsUri);
            new this.kurentoClient(wsUri, (error, kurentoClient: Kurento.Client.IKurentoClient) => {
                if (error)
                    return callback(error)

                var innerKurrentoClient = new KurentoClientWrapper(this.clientCounter.nextUniqueId, wsUri, kurentoClient);
                this.clients.push(innerKurrentoClient);
                callback(null, innerKurrentoClient);
            });
        }
    }

    findOrCreateClient(callback: (err, client?: KurentoClientWrapper) => void): void {
        var client = this.clients.filter(c => c.uri == this.wsUri)[0];
        if (client)
            return callback(client);
        this.addClient(this.wsUri, callback);
    }

    getClientById(id: number): KurentoClientWrapper {
        return this.clients.filter(c => c.id === id)[0];
    }

    findAvailableClient() {
        return this.clients.sort((a, b) => a.connectionCounter.getConnectionCount() - b.connectionCounter.getConnectionCount())[0];
    }

    removeClientById(id: number) {
        var client = this.getClientById(id),
            index = this.clients.indexOf(client);
        if (index !== -1)
            this.clients.splice(index, 1);
    }
}

class KurentoClientWrapper {

    constructor(id: number, uri: string, client: Kurento.Client.IKurentoClient) {
        this._id = id;
        this._uri = uri;
        this._client = client;
    }

    get id(): number {
        return this._id;
    }
    private _id: number;

    get uri(): string {
        return this._uri;
    }
    private _uri: string;

    get client(): Kurento.Client.IKurentoClient {
        return this._client;
    }
    private _client: Kurento.Client.IKurentoClient;

    //  It means connection from current app:
    private masterConnectionCount = 0;

    private viewerConnectionCount = 0;

    connectionCounter = {
        processMasterConnected: () => this.masterConnectionCount++,
        processMasterDisconnected: () => this.masterConnectionCount--,
        processVieverConnected: () => this.viewerConnectionCount++,
        processVieverDisconected: () => this.viewerConnectionCount--,
        getConnectionCount: () => (this.masterConnectionCount + this.viewerConnectionCount)
    }

}



