import AppConfig = require('../AppConfig'); 
import mongoose = require('mongoose');
import logger = require('../Logger');
import Monitor = require('../KurentoMonitor/Monitor');
import Model = require('./Model');

interface IVideoConsumer extends Storage.IVideoConsumer, mongoose.Document { }
interface IKurentoServer extends Storage.IKurentoServer, mongoose.Document  { }
interface IMonit extends Monitor.IMonit, mongoose.Document { }

class KurentoHubDb {
	
	private videoConsumers : mongoose.Model<IVideoConsumer> = Model.VideoConsumer; 
	private kurentoServers  : mongoose.Model<IKurentoServer> = Model.KurentoServer;
	private monitModels : mongoose.Model<IMonit> = Model.Monit;
	
	constructor() {
		
		logger.info("Trying connect to database.");
		
		mongoose.connect(AppConfig.config.mongodb.uri);
		var db = mongoose.connection;
		
		db.on('error', (err) => {
    		logger.error('Connection error:', err.message);
		});
		
		db.once('open', () => {
    		logger.info("Connected to database.");
		});
				
	}
	
	
	
	seedData(): Promise<any> {
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
					
				kurentoSer.save((err, server : IKurentoServer) => {
					if (err)
						err;
						//нормального обработчика сюда! ТУТ Pi@#&*

				}) 
			})
			
			
			resolve();
		});
	}
	
	getKurentoServers(): Promise<Storage.IKurentoServer[]> {
		return new Promise((resolve, reject) => {
			Model.KurentoServer.find((err, servers) => { 
				
				if (err)
					reject(err); // И СЮДА!
					
				resolve(servers);
			})
		});
	}
	
	//private kurentoServers: Storage.IKurentoServer[] = [];
	
	getRegisteredVideoConsumers(): Promise<Storage.IVideoConsumer[]> {
		return new Promise((resolve, reject) => {
			this.videoConsumers.find((err, consumers) => { 
				if (err)
					reject(err); // И СЮДА!
					
				resolve(consumers);
			})
		});
	}
	
	registerVideoConsumer(): Promise<Storage.IVideoConsumer> {
		var videoConsumera: Storage.IVideoConsumer = { 
			clientId: '' , //this.registeredVideoConsumers.reduce((p, c) => Math.max(p, c.clientId), 1) + 1,
			registerTime: new Date(),
			streamConnections: []
		};
		
		var videoConsumer = new this.videoConsumers({ 
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
	
	//private registeredVideoConsumers: Storage.IVideoConsumer[] = [];
	
}

export = KurentoHubDb;