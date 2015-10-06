/// <reference path="IdCounter.ts" />


class KurentoClientManager {

    private clientCounter = new IdCounter();

    private clients: KurentoClientWrapper[] = []

    addClient(clientUri: string, onSuccess: (client: KurentoClientWrapper, msg?: string) => void, onError: (err) => void) {
        var existingClient = this.clients.filter(c => c.uri === clientUri)[0];

        if (existingClient)
            onSuccess(existingClient, 'The client with the specified Uri already exists');
        else
            KurentoClient(clientUri, (error, kurentoClient: Kurento.IKurentoClient) => {
                if (error)
                    return onError(error)

                var innerKurrentoClient = new KurentoClientWrapper(this.clientCounter.nextUniqueId, clientUri, kurentoClient);
                this.clients.push(innerKurrentoClient);
                onSuccess(innerKurrentoClient);
            });
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

    constructor(id: number, uri: string, client: Kurento.IKurentoClient) {
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

    get client(): Kurento.IKurentoClient {
        return this._client;
    }
    private _client: Kurento.IKurentoClient;

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



