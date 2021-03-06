import mongoose = require('mongoose');
import Document = require('./Document.ts');

var videoConsumerSchema: mongoose.Schema = new mongoose.Schema({
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

var kurentoServerSchema: mongoose.Schema = new mongoose.Schema({
	__id: {
		type: String,
		unique: true,
	},
	url: {
		type: String,
		unique: true,
	}
});

var monitSchema: mongoose.Schema = new mongoose.Schema({
	url : {
		monitUrl: {
			href: String,
        	protocol: String,
        	auth: String,
 	        hostname: String,
    	    port: String,
        	host: String,
	        pathname: String,
    	    search: String,
        	//query: // string | Object //Type "object"" can not be in the database
	        slashes: Boolean,
    	    hash: String,
        	path: String,
		}
	},
	
	currentStatus: {
		state: Number,
		status: Number,
		time: {
			type: Date,
			default: Date.now
		},
		uptime: Number,
		memory: Number,
		cpu: Number,
	}
});
		
var model = {
	VideoConsumer : mongoose.model<Document.IVideoConsumerDocument>("VideoConsumer", videoConsumerSchema),
	KurentoServer : mongoose.model<Document.IKurentoServerDocument>("KurentoServer", kurentoServerSchema),
	Monit : mongoose.model<Document.IMonitDocument>("Monit", monitSchema),
}		

export = model;