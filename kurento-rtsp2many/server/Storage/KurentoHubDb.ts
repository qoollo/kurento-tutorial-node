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

	connect(reconect : boolean = false): Promise<any> {
		logger.info("Trying connect to database.");
		
		if (this.state == DbState.Disconnected || reconect) {
			
			this.lastConnectionPromise = new Promise((resolve, reject) => {
				logger.info("Creating new connection to KurentoDb.");

				this.state = DbState.Connecting;
				mongoose.connect(AppConfig.config.mongodb.uri);

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
		
		return new Promise((resolve, reject) => {
            AppConfig.config.kurentoMediaServer.defaultInstances.forEach((e, i) => {
                var template = AppConfig.config.kurentoMediaServer.wsUrlTemplate,
                    getAddress = srv => {
                        var res = template;
                        for (var f in srv) {
                            res = template.replace('${' + f + '}', srv[f]);
                        }
                        return res;
                    };

                var kurentoSer = new Model.KurentoServer({
                    __id: i.toString(),
                    url: getAddress(e)
                })

				kurentoSer.save((err, server: Document.IKurentoServerDocument) => {
					if (err)
						err;
					//нормального обработчика сюда! ТУТ Pi@#&*

				})
			})

			resolve();
		});
	}

	getKurentoServers(): Promise<Storage.IKurentoServer[]> {
		if (this.state != DbState.Connected)
			return Promise.reject(this.ACTION_WITH_DISCONNECTED_DB_ERROR);
		
		return new Promise((resolve, reject) => {
			Model.KurentoServer.find((err, servers) => {

				if (err)
					reject(err); // И СЮДА!
					
				resolve(servers);
			})
		});
	}
	
	getRegisteredVideoConsumers(): Promise<Storage.IVideoConsumer[]> {
		if (this.state != DbState.Connected)
			return Promise.reject(this.ACTION_WITH_DISCONNECTED_DB_ERROR);
		
		return new Promise((resolve, reject) => {
			Model.VideoConsumer.find((err, consumers) => {
				if (err)
					reject(err); // И СЮДА!
					
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
				if (err)
					reject(err); // И СЮДА!
				
				videoConsumer.clientId = videoConsumer.id;
				resolve(<Storage.IVideoConsumer>videoConsumer);
			})
		});
	}
	
}

export = new KurentoHubDb();