import AppConfig = require('../AppConfig');
import mongoose = require('mongoose');
import logger = require('../Logger');
import Monitor = require('../KurentoMonitor/Monitor');
import Model = require('./Model');
import Document = require('./Document.ts');
import DbState = require('./DbState');

class KurentoHubDb {

	private ACTION_WITH_DISCONNECTED_DB_ERROR = 'No connection to the database.';

	public state: DbState;
	private lastConnectionPromise: Promise<any>;

	constructor() {
		this.state = DbState.Disconnected;
	}

	connect(reconect: boolean = false): Promise<any> {
		logger.info("Trying connect to database.");

		if (this.state == DbState.Disconnected || reconect) {

			this.lastConnectionPromise = new Promise((resolve, reject) => {
				logger.info("Creating new connection to KurentoDb.");

				this.state = DbState.Connecting;
				mongoose.connect(AppConfig.config.get().mongodb.uri);

				var db = mongoose.connection;

				db.on('error', (err) => {
					logger.error('Connection to db error:', err.message);
					reject(err);

					this.state = DbState.Disconnected;
					this.lastConnectionPromise = null;
				});

				db.once('open', () => {
					logger.info("Connected to database.");
					resolve();

					this.state = DbState.Connected;
				});
			})
		}
		else
			logger.warn("Already connected to database.");

		return this.lastConnectionPromise;
	}

	seedData(): Promise<any> {
		if (this.state != DbState.Connected)
			return Promise.reject(this.ACTION_WITH_DISCONNECTED_DB_ERROR);

		logger.info("Trying seed data.");
		return new Promise((resolve, reject) => {
			var savePromises = [],
				errors = [];

            AppConfig.config.get().kurentoMediaServer.defaultInstances.forEach((e, i) => {
                var template = AppConfig.config.get().kurentoMediaServer.wsUrlTemplate,
                    getAddress = srv => {
                        var res = template;
                        for (var f in srv) {
                            res = template.replace('${' + f + '}', srv[f]);
                        }
                        return res;
                    };

				var kurentoSer = {
                    __id: i.toString(),
                    url: getAddress(e)
                }

				var savePromiseHandler = (res, rej) => {
					new Model.KurentoServer(kurentoSer)
						.save((err, server: Document.IKurentoServerDocument) => {
							if (err) {
								logger.error('An error occurred while saving kurento-server.', err);
								errors.push({
									data: kurentoSer,
									error: err
								})
								rej(err);
							}
							else
								res();
						});
				}

				Model.KurentoServer.findOne(kurentoSer, (error, res) => {
					if (res)
						logger.info("During seeding it emerged that some of the data already exist", kurentoSer);
					else
						savePromises.push( new Promise(savePromiseHandler))
				})
			})

			Promise.all(savePromises).then(resolve, () => { reject(errors) })
			logger.info("Seeding complete.");
		});
	}

	getKurentoServers(): Promise<Storage.IKurentoServer[]> {
		if (this.state != DbState.Connected)
			return Promise.reject(this.ACTION_WITH_DISCONNECTED_DB_ERROR);

		return new Promise((resolve, reject) => {
			Model.KurentoServer.find((err, servers) => {

				if (err) {
					logger.error('An error occurred while getting kurento-servers.', err);
					reject(err);
				}

				resolve(servers);
			})
		});
	}

	getRegisteredVideoConsumers(): Promise<Storage.IVideoConsumer[]> {
		if (this.state != DbState.Connected)
			return Promise.reject(this.ACTION_WITH_DISCONNECTED_DB_ERROR);

		return new Promise((resolve, reject) => {
			Model.VideoConsumer.find((err, consumers) => {
				if (err) {
					logger.error('An error occurred while getting registered video consumer.', err);
					reject(err);
				}

				resolve(consumers);
			})
		});
	}

	registerVideoConsumer(): Promise<Storage.IVideoConsumer> {
		if (this.state != DbState.Connected)
			return Promise.reject(this.ACTION_WITH_DISCONNECTED_DB_ERROR);

		var videoConsumera: Storage.IVideoConsumer = {
			clientId: '',
			registerTime: new Date(),
			streamConnections: []
		};

		var videoConsumer = new Model.VideoConsumer({
			registerTime: new Date(),
			streamConnections: []
		})

		return new Promise((resolve, reject) => {
			videoConsumer.save((err) => {
				if (err) {
					logger.error('An error occurred while registing video consumer.', err);
					reject(err);
				}

				videoConsumer.clientId = videoConsumer.id;
				resolve(<Storage.IVideoConsumer>videoConsumer);
			})
		});
	}

	saveMonit(monit : Monitor.IMonit) : Promise<any> {
		if (this.state != DbState.Connected)
			return Promise.reject(this.ACTION_WITH_DISCONNECTED_DB_ERROR);
			
		return new Promise((resolve, reject) => {
			new Model.Monit(monit).save((err, newMonit) => {
				if (err) {
					logger.error('An error occurred while saving monit.', err);
					reject(err);
				}

				resolve(monit);
			})
		});
	}
	
	getLastMonitUrl() : Promise<Monitor.IMonitUrl> {
		if (this.state != DbState.Connected)
			return Promise.reject(this.ACTION_WITH_DISCONNECTED_DB_ERROR);
			
		return new Promise((resolve, reject) => {
			Model.Monit.find({},null, {limit: 1, sort: {'currentStatus.time': -1}},(err, monits) => {
				if (err) {
					logger.error('An error occurred while getting last monit url.', err);
					reject(err);
				}

				resolve(monits[0] && monits[0].url);
			})
		});
	}
	
}

export = new KurentoHubDb();