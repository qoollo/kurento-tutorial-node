﻿/*
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

import path = require('path');
import express = require('express');
import ws = require('ws');
import minimist = require('minimist');
import url = require('url');
var KurentoClient: Kurento.Client.IKurentoClientConstructor = require('kurento-client');
var kurentoUtils: Kurento.Utils.IKurentoUtils = require('kurento-utils');

import MasterManagerModule = require('./server/MasterManager');
var MasterManager = MasterManagerModule.MasterManager;

import MasterModule = require('./server/Master');
var Master = MasterModule.Master;

import ViewerManagerModule = require('./server/ViewerManager');
var ViewerManager = ViewerManagerModule.ViewerManager;

import IdCounterModule = require('./server/IdCounter');
var IdCounter = IdCounterModule.IdCounter;

import KurentoClientManagerModule = require('./server/KurentoClientManager');
var KurentoClientManager = KurentoClientManagerModule.KurentoClientManager;

var argv = minimist(process.argv.slice(2),
    {
        default:
        {
            as_uri: "http://localhost:8080/",
            ws_uri: "ws://10.5.6.119:8888/kurento"
        }
    });

var app = express();


/*
 * Definition of global variables.
 */

var idCounter = 0;
var master: { id: string, webRtcEndpoint: Kurento.Client.IWebRtcEndpoint } = null;
var masterManager = new MasterManager(),
    viewerManager = new ViewerManager();
var kurentoClientManager = new KurentoClientManager(KurentoClient);
var pipeline: Kurento.Client.IMediaPipeline = null;
var viewers = {};
var client: Kurento.Client.IKurentoClient = null;

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
    console.log('Kurento Tutorial started');
    console.log('Open ' + url.format(asUrl) + ' with a WebRTC capable browser');
});

console.log('Starting WebSocket...');

var wssForControl = new ws.Server({
    server: server,
    path: '/control'
}, (...args: any[]) => { console.log('control', args); });
var controlSessionIdCounter = new IdCounter();

wssForControl.on('connection', function (ws) {

    var sessionId = controlSessionIdCounter.nextUniqueId;

    console.log('Connection for control received. Session id: ' + sessionId);

    ws.on('error', function (error) {
        console.log('There was an error in the control-connection №' + sessionId, error);
    });

    ws.on('close', function () {
        console.log('Control-connection #' + sessionId + ' closed');
    });

    ws.on('message', function (_message) {
        var message = JSON.parse(_message),
            response;
        console.log('Control-connection #' + sessionId + ' received message:', message);

        switch (message.rpc) {
            case 'AddMaster':
                console.log('"AddMaster" command called with params', message.params);
                if (!!message.params.streamUrl)
                    response = addMasterIfNotExists(message.params.streamUrl);
                else
                    response = new RpcErrorResponse('Message doesn`t contain camera URL', message.params.streamUrl);
                ws.send(JSON.stringify(response));
                break;
            case 'AddViewer':
                processAddViewer(sessionId, message.params.streamUrl, message.params.sdpOffer, r => ws.send(JSON.stringify(r)));
                break;

            default:
                response = new RpcErrorResponse('Unknown RPC: ', message.rpc)
                ws.send(JSON.stringify(response));
                break;
        }

    });

})

function addMasterIfNotExists(streamUrl: string): RpcResponse {
    var master = masterManager.getMasterByStreamUrl(streamUrl);
    if (!master)
        master = masterManager.addMaster(new Master(null, streamUrl, null, kurentoClientManager));
    return new RpcSuccessResponse('Master has been successfully added', master.id);
}

function processAddViewer(sessionId: number, streamUrl: string, sdpOffer: string, callback: (r: RpcResponse) => void): void {
    var viewer = viewerManager.getViewerBySessionId(sessionId),
        master = masterManager.getMasterByStreamUrl(streamUrl),
        res: RpcResponse;
    if (!master)
        callback(new RpcErrorResponse('Master for specified StreamUrl is not created yet. Call AddMaster RPC first.', streamUrl));
    else {
        if (!viewer)
            viewer = viewerManager.addViewer(new Viewer(sessionId, streamUrl, sdpOffer));

        master.addViewer(viewer, (err, sdpAnswer) => {
            if (err)
                return console.error('Failed to add Viewer to Master.', sdpAnswer);
            console.log('Added Viewer to Master. SdpAnswer:', sdpAnswer);
            callback(new RpcSuccessResponse('Great success! Viewer added to Master', { rpc: 'AddViewerResponse', streamUrl: streamUrl, sdpAnswer: sdpAnswer }));
        });

    }
}

/*
 * Definition of functions
 */


var sender,
    receivers = [];
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

function stop(id: string, ws: WebSocket): void {
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
    } else if (viewers[id]) {
        var viewer = viewers[id];
        if (viewer.webRtcEndpoint)
            viewer.webRtcEndpoint.release();
        delete viewers[id];
    }
}

//Classes:



class RpcResponse {

    constructor(public status: string, public message, public data?) {
        this.status = status;
        this.message = message;
        this.data = data;
    }
}

class RpcSuccessResponse extends RpcResponse {
    constructor(message, data) {
        super(RpcResponseStatus[RpcResponseStatus.Success], message, data);
    }
}

class RpcErrorResponse extends RpcResponse {
    constructor(message, data) {
        super(RpcResponseStatus[RpcResponseStatus.Error], message, data);
    }
}


enum RpcResponseStatus {
    Success,
    Error
}

app.use(express.static(path.join(__dirname, 'static')));
