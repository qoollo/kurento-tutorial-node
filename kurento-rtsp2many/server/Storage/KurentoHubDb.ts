import AppConfig = require('../AppConfig'); 
import mongoose = require('mongoose');
import logger = require('../Logger');
import Monitor = require('../KurentoMonitor/Monitor');

interface IVideoConsumer extends Storage.IVideoConsumer, mongoose.Document { }
interface IKurentoServer extends Storage.IKurentoServer, mongoose.Document  { }
interface IMonit extends Monitor.IMonit, mongoose.Document { }

class KurentoHubDb {
	
	private videoConsumers : mongoose.Model<IVideoConsumer>; 
	private kurentoServers  : mongoose.Model<IKurentoServer>;
	private monitModels : mongoose.Model<IMonit>;
	
	constructor() {
		logger.info("Trying connect to database.");
		
		mongoose.connect(AppConfig.config.mongo.uri);
		var db = mongoose.connection;
		
		db.on('error', (err) => {
    		logger.error('Connection error:', err.message);
		});
		
		db.once('open', () => {
    		logger.info("Connected to database.");
		});
		
		var videoConsumerSchema : mongoose.Schema = new mongoose.Schema({
    		registerTime: {
      			type: Date,
      			default: Date.now
    		},
    		streamConnections: [{
				streamUrl: String,
				kurentoServerId: String,
				connectTime: {
            		type: Date,
            		default: Date.now
        		},
			}],
		});
		this.videoConsumers = mongoose.model<IVideoConsumer>("VideoConsumer", videoConsumerSchema);
	
		var kurentoServerSchema : mongoose.Schema = new mongoose.Schema({
   			__id: {
				   type: String,
				   unique: true,
			},
			url: {
				type : String,	
				unique: true,
			} 
		});
		this.kurentoServers = mongoose.model<IKurentoServer>("KurentoServer", kurentoServerSchema);
		
		var monitSchema : mongoose.Schema = new mongoose.Schema({
    		currentStatus: {
      			state: Number,
				status : Number,
				isMonitored : Boolean,
				isPending : Boolean,
				uptime : Number,
				memory : Number,
				cpu : Number,
			}
		});
		this.monitModels = mongoose.model<IMonit>("Monit", monitSchema);		
	}
	
	
	
	seedData(): Promise<any> {
		return new Promise((resolve, reject) => {
			AppConfig.config.kurentoMediaServer.defaultInstances.forEach((e, i) => {
				var kurentoSer = new this.kurentoServers({ 
					__id: i.toString(),
					url: AppConfig.config.kurentoMediaServer.wsUrlTemplate(e.domain) 
				})
					
				kurentoSer.save((err, server : IKurentoServer) => {
					if (err)
						err;
						//нормального обработчика сюда! ТУТ Pi@#&*
					var a = server.url;
					var b = server.__id;
					
					var c = server;
				}) 
			})
			
			resolve();
		});
	}
	
	getKurentoServers(): Promise<Storage.IKurentoServer[]> {
		return new Promise((resolve, reject) => {
			this.kurentoServers.find((err, servers) => { 
				servers.forEach((s) => s.re)
				
				if (err)
					reject(err); // И СЮДА!
					
				resolve();
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