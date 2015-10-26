import mongoose = require('mongoose');
import Monitor = require('../../KurentoMonitor/Monitor');

declare module Document {
	
	interface IVideoConsumerDocument extends Storage.IVideoConsumer, mongoose.Document { }
	
	interface IKurentoServerDocument extends Storage.IKurentoServer, mongoose.Document  { }
	
	interface IMonitDocument extends Monitor.IMonit, mongoose.Document { }
	
}

export = Document;