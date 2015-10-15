/*
 * (C) Copyright 2014 Kurento (http://kurento.org/)
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Lesser General Public License
 * (LGPL) version 2.1 which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/lgpl-2.1.html
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 */
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var express = require('express');
var ws = require('ws');
var minimist = require('minimist');
var url = require('url');
var readline = require('readline');
var KurentoClient = require('kurento-client');
var kurentoUtils = require('kurento-utils');
var logger = require('./Logger');
var KurentoHubServer = require('./KurentoHubServer');
var MasterManager = require('./MasterManager');
var Master = require('./Master');
var ViewerManager = require('./ViewerManager');
var IdCounter = require('./IdCounter');
var KurentoClientManager = require('./KurentoClientManager');
var argv = minimist(process.argv.slice(2), {
    default: {
        as_uri: "http://localhost:8081/",
        ws_uri: "ws://10.5.6.119:8888/kurento"
    }
});
logger.info('KurentoHub started.');
debugger;
var app = express();
var kurentoHubServer = new KurentoHubServer();
kurentoHubServer.start().then(function () {
    debugger;
});
//  Windows handler for Ctrl + C
if (process.platform == 'win32') {
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.on('SIGINT', function () { return process.emit('SIGINT'); });
}
//  Handler for Ctrl + C
process.on('SIGINT', function () {
    logger.info("Caught interrupt signal. Stopping KurentoHubServer...");
    kurentoHubServer.stop()
        .then(function () {
        logger.info('KurentoHubServer stopped. Goodbye!');
        process.exit();
    }, function () {
        logger.error('Failed to stop KurentoHubServer.');
        process.exit(1);
    });
});
/*
 * Definition of global variables.
 */
var idCounter = 0;
var master = null;
var masterManager = new MasterManager(), viewerManager = new ViewerManager();
var kurentoClientManager = new KurentoClientManager(KurentoClient);
var pipeline = null;
var viewers = {};
var client = null;
function nextUniqueId() {
    idCounter++;
    return idCounter.toString();
}
/*
 * Server startup
 */
var asUrl = url.parse(argv['as_uri']);
var port = asUrl.port;
var server = app.listen(port, function () {
    logger.info('Kurento Tutorial started');
    logger.info('Open ' + url.format(asUrl) + ' with a WebRTC capable browser');
});
logger.info('Starting WebSocket...');
var wssForControl = new ws.Server({
    server: server,
    path: '/control'
}, function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    logger.info('control', args);
});
var controlSessionIdCounter = new IdCounter();
wssForControl.on('connection', function (ws) {
    var sessionId = controlSessionIdCounter.nextUniqueId;
    logger.info('Connection for control received. Session id: ' + sessionId);
    ws.on('error', function (error) {
        logger.info('There was an error in the control-connection №' + sessionId, error);
    });
    ws.on('close', function () {
        logger.info('Control-connection #' + sessionId + ' closed');
    });
    ws.on('message', function (_message) {
        var message = JSON.parse(_message), response;
        logger.info('Control-connection #' + sessionId + ' received message:', message);
        switch (message.rpc) {
            case 'AddMaster':
                logger.info('"AddMaster" command called with params', message.params);
                if (!!message.params.streamUrl)
                    response = addMasterIfNotExists(message.params.streamUrl);
                else
                    response = new RpcErrorResponse('Message doesn`t contain camera URL', message.params.streamUrl);
                ws.send(JSON.stringify(response));
                break;
            case 'AddViewer':
                processAddViewer(sessionId, message.params.streamUrl, message.params.sdpOffer, function (r) { return ws.send(JSON.stringify(r)); });
                break;
            default:
                response = new RpcErrorResponse('Unknown RPC: ', message.rpc);
                ws.send(JSON.stringify(response));
                break;
        }
    });
});
function addMasterIfNotExists(streamUrl) {
    var master = masterManager.getMasterByStreamUrl(streamUrl);
    if (!master)
        master = masterManager.addMaster(new Master(null, streamUrl, null, kurentoClientManager));
    return new RpcSuccessResponse('Master has been successfully added', master.id);
}
function processAddViewer(sessionId, streamUrl, sdpOffer, callback) {
    var viewer = viewerManager.getViewerBySessionId(sessionId), master = masterManager.getMasterByStreamUrl(streamUrl), res;
    if (!master)
        callback(new RpcErrorResponse('Master for specified StreamUrl is not created yet. Call AddMaster RPC first.', streamUrl));
    else {
        if (!viewer)
            viewer = viewerManager.addViewer(new Viewer(sessionId, streamUrl, sdpOffer));
        master.addViewer(viewer, function (err, sdpAnswer) {
            if (err)
                return logger.error('Failed to add Viewer to Master.', sdpAnswer);
            logger.info('Added Viewer to Master. SdpAnswer:', sdpAnswer);
            callback(new RpcSuccessResponse('Great success! Viewer added to Master', { rpc: 'AddViewerResponse', streamUrl: streamUrl, sdpAnswer: sdpAnswer }));
        });
    }
}
/*
 * Definition of functions
 */
var sender, receivers = [];
function removeReceiver(id) {
    if (!receivers[id]) {
        return;
    }
    var receiver = receivers[id];
    receiver.webRtcEndpoint.release();
    delete receiver[id];
}
function removeSender() {
    if (sender === null) {
        return;
    }
    for (var ix in receivers) {
        removeReceiver(ix);
    }
    sender.webRtcEndpoint.release();
    sender = null;
}
function stop(id, ws) {
    if (master !== null && master.id == id) {
        for (var ix in viewers) {
            var viewer = viewers[ix];
            if (viewer.ws) {
                viewer.ws.send(JSON.stringify({
                    id: 'stopCommunication'
                }));
            }
        }
        viewers = {};
        pipeline.release();
        pipeline = null;
        master = null;
    }
    else if (viewers[id]) {
        var viewer = viewers[id];
        if (viewer.webRtcEndpoint)
            viewer.webRtcEndpoint.release();
        delete viewers[id];
    }
}
//Classes:
var RpcResponse = (function () {
    function RpcResponse(status, message, data) {
        this.status = status;
        this.message = message;
        this.data = data;
        this.status = status;
        this.message = message;
        this.data = data;
    }
    return RpcResponse;
})();
var RpcSuccessResponse = (function (_super) {
    __extends(RpcSuccessResponse, _super);
    function RpcSuccessResponse(message, data) {
        _super.call(this, RpcResponseStatus[RpcResponseStatus.Success], message, data);
    }
    return RpcSuccessResponse;
})(RpcResponse);
var RpcErrorResponse = (function (_super) {
    __extends(RpcErrorResponse, _super);
    function RpcErrorResponse(message, data) {
        _super.call(this, RpcResponseStatus[RpcResponseStatus.Error], message, data);
    }
    return RpcErrorResponse;
})(RpcResponse);
var RpcResponseStatus;
(function (RpcResponseStatus) {
    RpcResponseStatus[RpcResponseStatus["Success"] = 0] = "Success";
    RpcResponseStatus[RpcResponseStatus["Error"] = 1] = "Error";
})(RpcResponseStatus || (RpcResponseStatus = {}));
//app.use(express.static(path.join(__dirname, 'static')));

//# sourceMappingURL=server.js.map
