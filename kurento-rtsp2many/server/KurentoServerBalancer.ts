
import KurentoHubDb = require('./Storage/KurentoHubDb');

class KurentoServerBalancer {

	constructor(private _db: KurentoHubDb) {

	}

	getServerForStream(streamUrl: string): Promise<Storage.IKurentoServer> {
		return Promise.all<any>([this.getAllConnections(), this._db.getKurentoServers()])
			.then(results => {
				var connections: Storage.IStreamConnection[] = results[0],
					servers: Storage.IKurentoServer[] = results[1];
				return this.findServerPlayingStream(streamUrl, servers, connections) ||
					this.findLeastLoadedServer(servers, connections);
			});
	}

	private getAllConnections(): Promise<Storage.IStreamConnection[]> {
		return this._db.getRegisteredVideoConsumers()
			.then(consumers => {
				var connections: Storage.IStreamConnection[] = [];
				consumers.forEach(c => c.streamConnections.forEach(con => connections.push(con)));
				return connections;
			});
	}

	private findServerPlayingStream(streamUrl: string, servers: Storage.IKurentoServer[], connections: Storage.IStreamConnection[]): Storage.IKurentoServer {
		var res: Storage.IKurentoServer = null,
			match = connections.filter(c => c.streamUrl == streamUrl)[0];
		if (match)
			res = servers.filter(s => s._id == match.kurentoServer_id)[0];
		return res;
	}

	private findLeastLoadedServer(servers: Storage.IKurentoServer[], connections: Storage.IStreamConnection[]): Storage.IKurentoServer {
		var loads: { 
			server: Storage.IKurentoServer,
			streams: number
		}[] = servers.map(s => { return { server: s, streams: 0} });
		connections.forEach(c => loads.filter(l => l.server._id == c.kurentoServer_id)[0].streams++);
		loads.sort((a, b) => a.streams - b.streams);
		return loads[0].server;
	}
}

export = KurentoServerBalancer;