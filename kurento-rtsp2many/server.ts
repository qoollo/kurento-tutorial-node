/// <reference path="server/IdCounter.ts" />

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

var path = require('path');
var express = require('express');
var ws = require('ws');
var minimist = require('minimist');
var url = require('url');
var kurento = require('kurento-client');

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
var master = null;
var masterManager = new MasterManager();
var kurentoClientManager = new KurentoClientManager();
var pipeline = null;
var viewers = {};
var kurentoClient = null;

function nextUniqueId() {
    idCounter++;
    return idCounter.toString();
}

/*
 * Server startup
 */

var asUrl = url.parse(argv.as_uri);
var port = asUrl.port;
var server = app.listen(port, function () {
    console.log('Kurento Tutorial started');
    console.log('Open ' + url.format(asUrl) + ' with a WebRTC capable browser');
});

var wssForView = new ws.Server({
    server: server,
    path: '/call'
});
var viewSessionIdCounter = new IdCounter();

var wssForControl = new ws.Server({
    server: server,
    path: '/control'
});
var controlSessionIdCounter = new IdCounter();

wssForControl.on('connection', function (ws) {

    var sessionId = controlSessionIdCounter.nextUniqueId;

    console.log('Connection for control received. Session id: ' + sessionId);

    ws.on('error', function (error) {
        console.log('There was an error in the control-connection №' + sessionId, error);
    });

    ws.on('close', function () {
        console.log('Control-connection №' + sessionId + ' closed');
    });

    ws.on('message', function (_message) {
        var message = JSON.parse(_message);
        console.log('Control-connection №' + sessionId + ' received message ', message);

        var response;

        switch (message.action) {
            case 'AddMaster':
                if (!!message.streamUrl) {
                    var id = masterManager.addMaster(new Master(null, message.streamUrl));
                    response = new ActionResponse(statuses.success, 'Master has been successfully added', id);
                }
                else
                    response = new ActionResponse(statuses.error, 'Message doesn`t contain camera URL', message);
                break;

            default:
                response = new ActionResponse(statuses.error, 'Invalid message', message)
                break;
        }

        ws.send(JSON.stringify(response));
    });

})

/*
 * Management of WebSocket messages
 */
wssForView.on('connection', function (ws) {

    var sessionId = nextUniqueId();

    console.log('Connection received with sessionId ' + sessionId);

    ws.on('error', function (error) {
        console.log('Connection ' + sessionId + ' error');
        stop(sessionId, ws);
    });

    ws.on('close', function () {
        console.log('Connection ' + sessionId + ' closed');
        stop(sessionId, ws);
    });

    ws.on('message', function (_message) {
        var message = JSON.parse(_message);
        console.log('Connection ' + sessionId + ' received message ', message);

        switch (message.id) {
            case 'master':
                startMaster(sessionId, message.sdpOffer, ws,
                    function (error, sdpAnswer) {
                        if (error) {
                            return ws.send(JSON.stringify({
                                id: 'masterResponse',
                                response: 'rejected',
                                message: error
                            }));
                        }
                        ws.send(JSON.stringify({
                            id: 'masterResponse',
                            response: 'accepted',
                            sdpAnswer: sdpAnswer
                        }));
                    });
                break;

            case 'viewer':
                startViewer(sessionId, message.sdpOffer, ws, function (error,
                    sdpAnswer) {
                    if (error) {
                        return ws.send(JSON.stringify({
                            id: 'viewerResponse',
                            response: 'rejected',
                            message: error
                        }));
                    }

                    ws.send(JSON.stringify({
                        id: 'viewerResponse',
                        response: 'accepted',
                        sdpAnswer: sdpAnswer
                    }));
                });
                break;

            case 'stop':
                stop(sessionId, ws);
                break;

            default:
                ws.send(JSON.stringify({
                    id: 'error',
                    message: 'Invalid message ' + message
                }));
                break;
        }
    });
});

/*
 * Definition of functions
 */


function addMaster() {

}

// Recover kurentoClient for the first time.
function getKurentoClient(callback) {
    if (kurentoClient !== null) {
        return callback(null, kurentoClient);
    }

    kurento(argv.ws_uri, function (error, _kurentoClient) {
        if (error) {
            console.log("Coult not find media server at address " + argv.ws_uri);
            return callback("Could not find media server at address" + argv.ws_uri
                + ". Exiting with error " + error);
        }

        kurentoClient = _kurentoClient;
        callback(null, kurentoClient);
    });
}

function startMaster(id, sdp, ws, callback) {
    if (master !== null) {
        return callback("Another user is currently acting as sender. Try again later ...");
    }

    master = {
        id: id,
        webRtcEndpoint: null
    };

    if (pipeline !== null) {
        stop(id, ws);
    }

    getKurentoClient(function (error, kurentoClient) {
        if (error) {
            stop(id, ws);
            return callback(error);
        }

        if (master === null) {
            return callback('Request was cancelled by the user. You will not be sending any longer');
        }

        kurentoClient.create('MediaPipeline', function (error, _pipeline) {
            if (error) {
                return callback(error);
            }

            if (master === null) {
                return callback('Request was cancelled by the user. You will not be sending any longer');
            }

            pipeline = _pipeline;
            pipeline.create('WebRtcEndpoint', function (error, webRtcEndpoint) {
                if (error) {
                    stop(id, ws);
                    return callback(error);
                }

                if (master === null) {
                    return callback('Request was cancelled by the user. You will not be sending any longer');
                }

                master.webRtcEndpoint = webRtcEndpoint;

                webRtcEndpoint.processOffer(sdp, function (error, sdpAnswer) {
                    if (error) {
                        stop(id, ws)
                        return callback(error);
                    }

                    if (master === null) {
                        return callback('Request was cancelled by the user. You will not be sending any longer');
                    }

                    callback(null, sdpAnswer);
                });
            });
        });
    });
}

function startViewer(id, sdp, ws, callback) {
    if (master === null || master.webRtcEndpoint === null) {
        return callback("No active sender now. Become sender or . Try again later ...");
    }

    if (viewers[id]) {
        return callback("You are already viewing in this session. Use a different browser to add additional viewers.")
    }

    pipeline.create('WebRtcEndpoint', function (error, webRtcEndpoint) {
        if (error) {
            return callback(error);
        }

        var viewer = {
            id: id,
            ws: ws,
            webRtcEndpoint: webRtcEndpoint
        };
        viewers[viewer.id] = viewer;

        if (master === null) {
            stop(id, ws);
            return callback("No active sender now. Become sender or . Try again later ...");
        }

        webRtcEndpoint.processOffer(sdp, function (error, sdpAnswer) {
            if (error) {
                stop(id, ws);
                return callback(error);
            }

            if (master === null) {
                stop(id, ws);
                return callback("No active sender now. Become sender or . Try again later ...");
            }

            master.webRtcEndpoint.connect(webRtcEndpoint, function (error) {
                if (error) {
                    stop(id, ws);
                    return callback(error);
                }

                if (master === null) {
                    stop(id, ws);
                    return callback("No active sender now. Become sender or . Try again later ...");
                }

                return callback(null, sdpAnswer);
            });
        });
    });
}

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
    } else if (viewers[id]) {
        var viewer = viewers[id];
        if (viewer.webRtcEndpoint)
            viewer.webRtcEndpoint.release();
        delete viewers[id];
    }
}

//Classes:

function Master(id, streamUrl) {

    this.id = id;

    this.streamUrl = streamUrl;

    var viewers = [];

    var pipeline = null;
    var webRtcEndpoint = null;

    this.addViewer = function (viewer) {
        viewers.push(viewer);

        if (this.isOffline)
            startStream(); //Not implemented yet. Эта функция должна проставлять pipeline
    };

    this.removeViewer = function (viewer) {
        var index = viewers.indexOf(viewer);
        if (index == -1)
            return;

        viewers.splice(index, 1);

        if (!viewers.length && this.isOnline)
            stopStream(); 
    };

    Object.defineProperties(this, {
        status: {
            get: function () { return !!pipeline ? 'online' : 'offline' }
        },
        isOnline: {
            get: function () { return !!pipeline }
        },
        isOffline: {
            get: function () { return !pipeline }
        },
        viewers: {
            get: function () { return viewers }
        }
    });

    var self = this;

    function startStream() {
        if (self.isOnline) {
            console.log('WARNING! Trying to start an already running stream');
            return;
        }

        function stopProcessWithError(message) {
            console.log('ERROR! ' + message);

            if (pipeline)
                pipeline.release();

            pipeline = null;

            if (webRtcEndpoint)
                webRtcEndpoint.release();

            webRtcEndpoint = null;

            return;
        }

        var kurentoClient = kurentoClientManager.getAvailableClient();
        if (!kurentoClient)
            return stopProcessWithError('Trying to start stream when no one kurento client is exists');

        kurentoClient.client.create('MediaPipeline', function (error, _pipeline) {
            if (error)
                return stopProcessWithError('An error occurred while master №' + self.id + ' trying to create media pieline');

            pipeline = _pipeline;
            pipeline.create('WebRtcEndpoint', function (error, _webRtcEndpoint) {
                if (error)
                    return stopProcessWithError('An error occurred while master №' + self.id + ' trying to create WebRtc endpoint');

                webRtcEndpoint = _webRtcEndpoint;

                var sdp = 'WAAAT';
                throw new Error('тут не допилен sdp')
                webRtcEndpoint.processOffer(sdp, function (error, sdpAnswer) {
                    if (error)
                        return stopProcessWithError('An error occurred while WebRtc endpoint of master №' + self.id + 'trying to process offer'); //???

                    //где-то тут недопил функциональности.

                    //callback(null, sdpAnswer);
                });
            })
        })
    }

    function stopStream() {
        throw new Error('Not implemented yet. Эта функция должна проставлять pipeline на null');
    }
}

function MasterManager() {

    var masters = [];

    var idCounter = new IdCounter();

    this.addMaster = function (master) {
        master.id = idCounter.nextUniqueId;
        masters.push(master);

        return master.id;
    }

    this.getMasterById = function (id) {
        return masters.filter(function (master) { return master.id === id })[0];
    }

    Object.defineProperties(this, {
        masters: {
            get: function () { return masters }
        },
    });

}

function KurentoClientManager() {

    var clientCounter = new IdCounter();

    function KurentoClientWrapper(id, uri, client) {
        this.id = id;
        this.uri = uri;
        this.client = client;

        //It is mean connection from current app:
        var masterConnectionCount = 0;
        var viewerConnectionCount = 0;
        this.connectionCounter = {
            processMasterConnected: function () { masterConnectionCount++ },
            processMasterDisconnected: function () { masterConnectionCount-- },
            processVieverConnected: function () { viewerConnectionCount++ },
            processVieverDisconected: function () { viewerConnectionCount-- },
            getConnectionCount: function () { return (masterConnectionCount + viewerConnectionCount) }
        }

    }

    var clients = []

    this.addClient = function (clientUri, onSuccess, onError) {
        var existingClient = clients.filter(function (client) { return client.uri === clientUri })[0];

        if (existingClient)
            onSuccess(existingClient, 'The client with the specified Uri already exists');
        else
            kurento(clientUri, function (error, kurentoClient) {
                if (error)
                    return onError(error)

                var innerKurrentoClient = new KurentoClientWrapper(clientCounter.nextUniqueId, clientUri, kurentoClient);
                clients.push(innerKurrentoClient);
                onSuccess(innerKurrentoClient);
            });
    }

    this.getClientById = function (id) {
        return clients.filter(function (client) { return client.id === id })[0];
    }

    this.getAvailableClient = function () {
        return clients.sort(function (a, b) { return a.connectionCounter.getConnectionCount() - b.connectionCounter.getConnectionCount() })[0];
    }

    this.removeClientById = function (id) {
        var client = clients.filter(function (client) { return client.id === id })[0];

        if (!client)
            return;

        this.viewers.splice(clients.indexOf(client), 1);
    }
}

function ActionResponse(status, message, data) {
    this.status = status;
    this.message = message;
    this.data = data;
}

var statuses = {
    success: 'Success',
    error: 'Error'
}

app.use(express.static(path.join(__dirname, 'static')));
