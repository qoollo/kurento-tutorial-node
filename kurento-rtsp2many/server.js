var IdCounter = (function () {
    function IdCounter(startId) {
        if (startId === void 0) { startId = 0; }
        this._lastId = startId - 1;
    }
    Object.defineProperty(IdCounter.prototype, "nextUniqueId", {
        get: function () {
            this._lastId++;
            return this._lastId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(IdCounter.prototype, "lastId", {
        get: function () {
            return this._lastId;
        },
        enumerable: true,
        configurable: true
    });
    return IdCounter;
})();
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
var argv = minimist(process.argv.slice(2), {
    default: {
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
                response = new ActionResponse(statuses.error, 'Invalid message', message);
                break;
        }
        ws.send(JSON.stringify(response));
    });
});
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
                startMaster(sessionId, message.sdpOffer, ws, function (error, sdpAnswer) {
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
                startViewer(sessionId, message.sdpOffer, ws, function (error, sdpAnswer) {
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
                        stop(id, ws);
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
        return callback("You are already viewing in this session. Use a different browser to add additional viewers.");
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
            get: function () { return !!pipeline ? 'online' : 'offline'; }
        },
        isOnline: {
            get: function () { return !!pipeline; }
        },
        isOffline: {
            get: function () { return !pipeline; }
        },
        viewers: {
            get: function () { return viewers; }
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
                throw new Error('тут не допилен sdp');
                webRtcEndpoint.processOffer(sdp, function (error, sdpAnswer) {
                    if (error)
                        return stopProcessWithError('An error occurred while WebRtc endpoint of master №' + self.id + 'trying to process offer'); //???
                    //где-то тут недопил функциональности.
                    //callback(null, sdpAnswer);
                });
            });
        });
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
    };
    this.getMasterById = function (id) {
        return masters.filter(function (master) { return master.id === id; })[0];
    };
    Object.defineProperties(this, {
        masters: {
            get: function () { return masters; }
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
            processMasterConnected: function () { masterConnectionCount++; },
            processMasterDisconnected: function () { masterConnectionCount--; },
            processVieverConnected: function () { viewerConnectionCount++; },
            processVieverDisconected: function () { viewerConnectionCount--; },
            getConnectionCount: function () { return (masterConnectionCount + viewerConnectionCount); }
        };
    }
    var clients = [];
    this.addClient = function (clientUri, onSuccess, onError) {
        var existingClient = clients.filter(function (client) { return client.uri === clientUri; })[0];
        if (existingClient)
            onSuccess(existingClient, 'The client with the specified Uri already exists');
        else
            kurento(clientUri, function (error, kurentoClient) {
                if (error)
                    return onError(error);
                var innerKurrentoClient = new KurentoClientWrapper(clientCounter.nextUniqueId, clientUri, kurentoClient);
                clients.push(innerKurrentoClient);
                onSuccess(innerKurrentoClient);
            });
    };
    this.getClientById = function (id) {
        return clients.filter(function (client) { return client.id === id; })[0];
    };
    this.getAvailableClient = function () {
        return clients.sort(function (a, b) { return a.connectionCounter.getConnectionCount() - b.connectionCounter.getConnectionCount(); })[0];
    };
    this.removeClientById = function (id) {
        var client = clients.filter(function (client) { return client.id === id; })[0];
        if (!client)
            return;
        this.viewers.splice(clients.indexOf(client), 1);
    };
}
function ActionResponse(status, message, data) {
    this.status = status;
    this.message = message;
    this.data = data;
}
var statuses = {
    success: 'Success',
    error: 'Error'
};
app.use(express.static(path.join(__dirname, 'static')));

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNlcnZlci9JZENvdW50ZXIudHMiLCJzZXJ2ZXIudHMiXSwibmFtZXMiOlsiSWRDb3VudGVyIiwiSWRDb3VudGVyLmNvbnN0cnVjdG9yIiwiSWRDb3VudGVyLm5leHRVbmlxdWVJZCIsIklkQ291bnRlci5sYXN0SWQiLCJuZXh0VW5pcXVlSWQiLCJhZGRNYXN0ZXIiLCJnZXRLdXJlbnRvQ2xpZW50Iiwic3RhcnRNYXN0ZXIiLCJzdGFydFZpZXdlciIsInJlbW92ZVJlY2VpdmVyIiwicmVtb3ZlU2VuZGVyIiwic3RvcCIsIk1hc3RlciIsIk1hc3Rlci5zdGFydFN0cmVhbSIsIk1hc3Rlci5zdGFydFN0cmVhbS5zdG9wUHJvY2Vzc1dpdGhFcnJvciIsIk1hc3Rlci5zdG9wU3RyZWFtIiwiTWFzdGVyTWFuYWdlciIsIkt1cmVudG9DbGllbnRNYW5hZ2VyIiwiS3VyZW50b0NsaWVudE1hbmFnZXIuS3VyZW50b0NsaWVudFdyYXBwZXIiLCJBY3Rpb25SZXNwb25zZSJdLCJtYXBwaW5ncyI6IkFBQ0E7SUFFSUEsbUJBQVlBLE9BQW1CQTtRQUFuQkMsdUJBQW1CQSxHQUFuQkEsV0FBbUJBO1FBQzNCQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxPQUFPQSxHQUFHQSxDQUFDQSxDQUFDQTtJQUMvQkEsQ0FBQ0E7SUFJREQsc0JBQUlBLG1DQUFZQTthQUFoQkE7WUFDSUUsSUFBSUEsQ0FBQ0EsT0FBT0EsRUFBRUEsQ0FBQ0E7WUFDZkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0E7UUFDeEJBLENBQUNBOzs7T0FBQUY7SUFDREEsc0JBQUlBLDZCQUFNQTthQUFWQTtZQUNJRyxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQTtRQUN4QkEsQ0FBQ0E7OztPQUFBSDtJQUNMQSxnQkFBQ0E7QUFBREEsQ0FmQSxBQWVDQSxJQUFBO0FDaEJELDRDQUE0QztBQUU1QyxBQWVBOzs7Ozs7Ozs7Ozs7O0dBRkc7SUFFQyxJQUFJLEdBQUcsT0FBTyxD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QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsT0FBT0EsQ0FBQ0E7SUFDdkJBLElBQUlBLENBQUNBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBO0FBQ3JCQSxDQUFDQTtBQUVELElBQUksUUFBUSxHQUFHO0lBQ1gsT0FBTyxFQUFFLFNBQVM7SUFDbEIsS0FBSyxFQUFFLE9BQU87Q0FDakIsQ0FBQTtBQUVELEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlc0NvbnRlbnQiOltudWxsLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwic2VydmVyL0lkQ291bnRlci50c1wiIC8+XHJcblxyXG4vKlxyXG4gKiAoQykgQ29weXJpZ2h0IDIwMTQgS3VyZW50byAoaHR0cDovL2t1cmVudG8ub3JnLylcclxuICpcclxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC4gVGhpcyBwcm9ncmFtIGFuZCB0aGUgYWNjb21wYW55aW5nIG1hdGVyaWFsc1xyXG4gKiBhcmUgbWFkZSBhdmFpbGFibGUgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcclxuICogKExHUEwpIHZlcnNpb24gMi4xIHdoaWNoIGFjY29tcGFuaWVzIHRoaXMgZGlzdHJpYnV0aW9uLCBhbmQgaXMgYXZhaWxhYmxlIGF0XHJcbiAqIGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy9sZ3BsLTIuMS5odG1sXHJcbiAqXHJcbiAqIFRoaXMgbGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuIFNlZSB0aGUgR05VXHJcbiAqIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcbiAqXHJcbiAqL1xyXG5cclxudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XHJcbnZhciBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xyXG52YXIgd3MgPSByZXF1aXJlKCd3cycpO1xyXG52YXIgbWluaW1pc3QgPSByZXF1aXJlKCdtaW5pbWlzdCcpO1xyXG52YXIgdXJsID0gcmVxdWlyZSgndXJsJyk7XHJcbnZhciBrdXJlbnRvID0gcmVxdWlyZSgna3VyZW50by1jbGllbnQnKTtcclxuXHJcbnZhciBhcmd2ID0gbWluaW1pc3QocHJvY2Vzcy5hcmd2LnNsaWNlKDIpLFxyXG4gICAge1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBhc191cmk6IFwiaHR0cDovL2xvY2FsaG9zdDo4MDgwL1wiLFxyXG4gICAgICAgICAgICB3c191cmk6IFwid3M6Ly8xMC41LjYuMTE5Ojg4ODgva3VyZW50b1wiXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG52YXIgYXBwID0gZXhwcmVzcygpO1xyXG5cclxuXHJcbi8qXHJcbiAqIERlZmluaXRpb24gb2YgZ2xvYmFsIHZhcmlhYmxlcy5cclxuICovXHJcblxyXG52YXIgaWRDb3VudGVyID0gMDtcclxudmFyIG1hc3RlciA9IG51bGw7XHJcbnZhciBtYXN0ZXJNYW5hZ2VyID0gbmV3IE1hc3Rlck1hbmFnZXIoKTtcclxudmFyIGt1cmVudG9DbGllbnRNYW5hZ2VyID0gbmV3IEt1cmVudG9DbGllbnRNYW5hZ2VyKCk7XHJcbnZhciBwaXBlbGluZSA9IG51bGw7XHJcbnZhciB2aWV3ZXJzID0ge307XHJcbnZhciBrdXJlbnRvQ2xpZW50ID0gbnVsbDtcclxuXHJcbmZ1bmN0aW9uIG5leHRVbmlxdWVJZCgpIHtcclxuICAgIGlkQ291bnRlcisrO1xyXG4gICAgcmV0dXJuIGlkQ291bnRlci50b1N0cmluZygpO1xyXG59XHJcblxyXG4vKlxyXG4gKiBTZXJ2ZXIgc3RhcnR1cFxyXG4gKi9cclxuXHJcbnZhciBhc1VybCA9IHVybC5wYXJzZShhcmd2LmFzX3VyaSk7XHJcbnZhciBwb3J0ID0gYXNVcmwucG9ydDtcclxudmFyIHNlcnZlciA9IGFwcC5saXN0ZW4ocG9ydCwgZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc29sZS5sb2coJ0t1cmVudG8gVHV0b3JpYWwgc3RhcnRlZCcpO1xyXG4gICAgY29uc29sZS5sb2coJ09wZW4gJyArIHVybC5mb3JtYXQoYXNVcmwpICsgJyB3aXRoIGEgV2ViUlRDIGNhcGFibGUgYnJvd3NlcicpO1xyXG59KTtcclxuXHJcbnZhciB3c3NGb3JWaWV3ID0gbmV3IHdzLlNlcnZlcih7XHJcbiAgICBzZXJ2ZXI6IHNlcnZlcixcclxuICAgIHBhdGg6ICcvY2FsbCdcclxufSk7XHJcbnZhciB2aWV3U2Vzc2lvbklkQ291bnRlciA9IG5ldyBJZENvdW50ZXIoKTtcclxuXHJcbnZhciB3c3NGb3JDb250cm9sID0gbmV3IHdzLlNlcnZlcih7XHJcbiAgICBzZXJ2ZXI6IHNlcnZlcixcclxuICAgIHBhdGg6ICcvY29udHJvbCdcclxufSk7XHJcbnZhciBjb250cm9sU2Vzc2lvbklkQ291bnRlciA9IG5ldyBJZENvdW50ZXIoKTtcclxuXHJcbndzc0ZvckNvbnRyb2wub24oJ2Nvbm5lY3Rpb24nLCBmdW5jdGlvbiAod3MpIHtcclxuXHJcbiAgICB2YXIgc2Vzc2lvbklkID0gY29udHJvbFNlc3Npb25JZENvdW50ZXIubmV4dFVuaXF1ZUlkO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKCdDb25uZWN0aW9uIGZvciBjb250cm9sIHJlY2VpdmVkLiBTZXNzaW9uIGlkOiAnICsgc2Vzc2lvbklkKTtcclxuXHJcbiAgICB3cy5vbignZXJyb3InLCBmdW5jdGlvbiAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnVGhlcmUgd2FzIGFuIGVycm9yIGluIHRoZSBjb250cm9sLWNvbm5lY3Rpb24g4oSWJyArIHNlc3Npb25JZCwgZXJyb3IpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgd3Mub24oJ2Nsb3NlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdDb250cm9sLWNvbm5lY3Rpb24g4oSWJyArIHNlc3Npb25JZCArICcgY2xvc2VkJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB3cy5vbignbWVzc2FnZScsIGZ1bmN0aW9uIChfbWVzc2FnZSkge1xyXG4gICAgICAgIHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShfbWVzc2FnZSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0NvbnRyb2wtY29ubmVjdGlvbiDihJYnICsgc2Vzc2lvbklkICsgJyByZWNlaXZlZCBtZXNzYWdlICcsIG1lc3NhZ2UpO1xyXG5cclxuICAgICAgICB2YXIgcmVzcG9uc2U7XHJcblxyXG4gICAgICAgIHN3aXRjaCAobWVzc2FnZS5hY3Rpb24pIHtcclxuICAgICAgICAgICAgY2FzZSAnQWRkTWFzdGVyJzpcclxuICAgICAgICAgICAgICAgIGlmICghIW1lc3NhZ2Uuc3RyZWFtVXJsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlkID0gbWFzdGVyTWFuYWdlci5hZGRNYXN0ZXIobmV3IE1hc3RlcihudWxsLCBtZXNzYWdlLnN0cmVhbVVybCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gbmV3IEFjdGlvblJlc3BvbnNlKHN0YXR1c2VzLnN1Y2Nlc3MsICdNYXN0ZXIgaGFzIGJlZW4gc3VjY2Vzc2Z1bGx5IGFkZGVkJywgaWQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gbmV3IEFjdGlvblJlc3BvbnNlKHN0YXR1c2VzLmVycm9yLCAnTWVzc2FnZSBkb2VzbmB0IGNvbnRhaW4gY2FtZXJhIFVSTCcsIG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UgPSBuZXcgQWN0aW9uUmVzcG9uc2Uoc3RhdHVzZXMuZXJyb3IsICdJbnZhbGlkIG1lc3NhZ2UnLCBtZXNzYWdlKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlKSk7XHJcbiAgICB9KTtcclxuXHJcbn0pXHJcblxyXG4vKlxyXG4gKiBNYW5hZ2VtZW50IG9mIFdlYlNvY2tldCBtZXNzYWdlc1xyXG4gKi9cclxud3NzRm9yVmlldy5vbignY29ubmVjdGlvbicsIGZ1bmN0aW9uICh3cykge1xyXG5cclxuICAgIHZhciBzZXNzaW9uSWQgPSBuZXh0VW5pcXVlSWQoKTtcclxuXHJcbiAgICBjb25zb2xlLmxvZygnQ29ubmVjdGlvbiByZWNlaXZlZCB3aXRoIHNlc3Npb25JZCAnICsgc2Vzc2lvbklkKTtcclxuXHJcbiAgICB3cy5vbignZXJyb3InLCBmdW5jdGlvbiAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnQ29ubmVjdGlvbiAnICsgc2Vzc2lvbklkICsgJyBlcnJvcicpO1xyXG4gICAgICAgIHN0b3Aoc2Vzc2lvbklkLCB3cyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB3cy5vbignY2xvc2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0Nvbm5lY3Rpb24gJyArIHNlc3Npb25JZCArICcgY2xvc2VkJyk7XHJcbiAgICAgICAgc3RvcChzZXNzaW9uSWQsIHdzKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHdzLm9uKCdtZXNzYWdlJywgZnVuY3Rpb24gKF9tZXNzYWdlKSB7XHJcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSBKU09OLnBhcnNlKF9tZXNzYWdlKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnQ29ubmVjdGlvbiAnICsgc2Vzc2lvbklkICsgJyByZWNlaXZlZCBtZXNzYWdlICcsIG1lc3NhZ2UpO1xyXG5cclxuICAgICAgICBzd2l0Y2ggKG1lc3NhZ2UuaWQpIHtcclxuICAgICAgICAgICAgY2FzZSAnbWFzdGVyJzpcclxuICAgICAgICAgICAgICAgIHN0YXJ0TWFzdGVyKHNlc3Npb25JZCwgbWVzc2FnZS5zZHBPZmZlciwgd3MsXHJcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGVycm9yLCBzZHBBbnN3ZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6ICdtYXN0ZXJSZXNwb25zZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6ICdyZWplY3RlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyb3JcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiAnbWFzdGVyUmVzcG9uc2UnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6ICdhY2NlcHRlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZHBBbnN3ZXI6IHNkcEFuc3dlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3ZpZXdlcic6XHJcbiAgICAgICAgICAgICAgICBzdGFydFZpZXdlcihzZXNzaW9uSWQsIG1lc3NhZ2Uuc2RwT2ZmZXIsIHdzLCBmdW5jdGlvbiAoZXJyb3IsXHJcbiAgICAgICAgICAgICAgICAgICAgc2RwQW5zd2VyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiAndmlld2VyUmVzcG9uc2UnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6ICdyZWplY3RlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBlcnJvclxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6ICd2aWV3ZXJSZXNwb25zZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlOiAnYWNjZXB0ZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZHBBbnN3ZXI6IHNkcEFuc3dlclxyXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdzdG9wJzpcclxuICAgICAgICAgICAgICAgIHN0b3Aoc2Vzc2lvbklkLCB3cyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogJ2Vycm9yJyxcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnSW52YWxpZCBtZXNzYWdlICcgKyBtZXNzYWdlXHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG4vKlxyXG4gKiBEZWZpbml0aW9uIG9mIGZ1bmN0aW9uc1xyXG4gKi9cclxuXHJcblxyXG5mdW5jdGlvbiBhZGRNYXN0ZXIoKSB7XHJcblxyXG59XHJcblxyXG4vLyBSZWNvdmVyIGt1cmVudG9DbGllbnQgZm9yIHRoZSBmaXJzdCB0aW1lLlxyXG5mdW5jdGlvbiBnZXRLdXJlbnRvQ2xpZW50KGNhbGxiYWNrKSB7XHJcbiAgICBpZiAoa3VyZW50b0NsaWVudCAhPT0gbnVsbCkge1xyXG4gICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCBrdXJlbnRvQ2xpZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBrdXJlbnRvKGFyZ3Yud3NfdXJpLCBmdW5jdGlvbiAoZXJyb3IsIF9rdXJlbnRvQ2xpZW50KSB7XHJcbiAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ291bHQgbm90IGZpbmQgbWVkaWEgc2VydmVyIGF0IGFkZHJlc3MgXCIgKyBhcmd2LndzX3VyaSk7XHJcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhcIkNvdWxkIG5vdCBmaW5kIG1lZGlhIHNlcnZlciBhdCBhZGRyZXNzXCIgKyBhcmd2LndzX3VyaVxyXG4gICAgICAgICAgICAgICAgKyBcIi4gRXhpdGluZyB3aXRoIGVycm9yIFwiICsgZXJyb3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAga3VyZW50b0NsaWVudCA9IF9rdXJlbnRvQ2xpZW50O1xyXG4gICAgICAgIGNhbGxiYWNrKG51bGwsIGt1cmVudG9DbGllbnQpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0YXJ0TWFzdGVyKGlkLCBzZHAsIHdzLCBjYWxsYmFjaykge1xyXG4gICAgaWYgKG1hc3RlciAhPT0gbnVsbCkge1xyXG4gICAgICAgIHJldHVybiBjYWxsYmFjayhcIkFub3RoZXIgdXNlciBpcyBjdXJyZW50bHkgYWN0aW5nIGFzIHNlbmRlci4gVHJ5IGFnYWluIGxhdGVyIC4uLlwiKTtcclxuICAgIH1cclxuXHJcbiAgICBtYXN0ZXIgPSB7XHJcbiAgICAgICAgaWQ6IGlkLFxyXG4gICAgICAgIHdlYlJ0Y0VuZHBvaW50OiBudWxsXHJcbiAgICB9O1xyXG5cclxuICAgIGlmIChwaXBlbGluZSAhPT0gbnVsbCkge1xyXG4gICAgICAgIHN0b3AoaWQsIHdzKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRLdXJlbnRvQ2xpZW50KGZ1bmN0aW9uIChlcnJvciwga3VyZW50b0NsaWVudCkge1xyXG4gICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICBzdG9wKGlkLCB3cyk7XHJcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobWFzdGVyID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygnUmVxdWVzdCB3YXMgY2FuY2VsbGVkIGJ5IHRoZSB1c2VyLiBZb3Ugd2lsbCBub3QgYmUgc2VuZGluZyBhbnkgbG9uZ2VyJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBrdXJlbnRvQ2xpZW50LmNyZWF0ZSgnTWVkaWFQaXBlbGluZScsIGZ1bmN0aW9uIChlcnJvciwgX3BpcGVsaW5lKSB7XHJcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG1hc3RlciA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCdSZXF1ZXN0IHdhcyBjYW5jZWxsZWQgYnkgdGhlIHVzZXIuIFlvdSB3aWxsIG5vdCBiZSBzZW5kaW5nIGFueSBsb25nZXInKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcGlwZWxpbmUgPSBfcGlwZWxpbmU7XHJcbiAgICAgICAgICAgIHBpcGVsaW5lLmNyZWF0ZSgnV2ViUnRjRW5kcG9pbnQnLCBmdW5jdGlvbiAoZXJyb3IsIHdlYlJ0Y0VuZHBvaW50KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdG9wKGlkLCB3cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobWFzdGVyID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCdSZXF1ZXN0IHdhcyBjYW5jZWxsZWQgYnkgdGhlIHVzZXIuIFlvdSB3aWxsIG5vdCBiZSBzZW5kaW5nIGFueSBsb25nZXInKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBtYXN0ZXIud2ViUnRjRW5kcG9pbnQgPSB3ZWJSdGNFbmRwb2ludDtcclxuXHJcbiAgICAgICAgICAgICAgICB3ZWJSdGNFbmRwb2ludC5wcm9jZXNzT2ZmZXIoc2RwLCBmdW5jdGlvbiAoZXJyb3IsIHNkcEFuc3dlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdG9wKGlkLCB3cylcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXN0ZXIgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCdSZXF1ZXN0IHdhcyBjYW5jZWxsZWQgYnkgdGhlIHVzZXIuIFlvdSB3aWxsIG5vdCBiZSBzZW5kaW5nIGFueSBsb25nZXInKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHNkcEFuc3dlcik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc3RhcnRWaWV3ZXIoaWQsIHNkcCwgd3MsIGNhbGxiYWNrKSB7XHJcbiAgICBpZiAobWFzdGVyID09PSBudWxsIHx8IG1hc3Rlci53ZWJSdGNFbmRwb2ludCA9PT0gbnVsbCkge1xyXG4gICAgICAgIHJldHVybiBjYWxsYmFjayhcIk5vIGFjdGl2ZSBzZW5kZXIgbm93LiBCZWNvbWUgc2VuZGVyIG9yIC4gVHJ5IGFnYWluIGxhdGVyIC4uLlwiKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodmlld2Vyc1tpZF0pIHtcclxuICAgICAgICByZXR1cm4gY2FsbGJhY2soXCJZb3UgYXJlIGFscmVhZHkgdmlld2luZyBpbiB0aGlzIHNlc3Npb24uIFVzZSBhIGRpZmZlcmVudCBicm93c2VyIHRvIGFkZCBhZGRpdGlvbmFsIHZpZXdlcnMuXCIpXHJcbiAgICB9XHJcblxyXG4gICAgcGlwZWxpbmUuY3JlYXRlKCdXZWJSdGNFbmRwb2ludCcsIGZ1bmN0aW9uIChlcnJvciwgd2ViUnRjRW5kcG9pbnQpIHtcclxuICAgICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB2aWV3ZXIgPSB7XHJcbiAgICAgICAgICAgIGlkOiBpZCxcclxuICAgICAgICAgICAgd3M6IHdzLFxyXG4gICAgICAgICAgICB3ZWJSdGNFbmRwb2ludDogd2ViUnRjRW5kcG9pbnRcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZpZXdlcnNbdmlld2VyLmlkXSA9IHZpZXdlcjtcclxuXHJcbiAgICAgICAgaWYgKG1hc3RlciA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICBzdG9wKGlkLCB3cyk7XHJcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhcIk5vIGFjdGl2ZSBzZW5kZXIgbm93LiBCZWNvbWUgc2VuZGVyIG9yIC4gVHJ5IGFnYWluIGxhdGVyIC4uLlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdlYlJ0Y0VuZHBvaW50LnByb2Nlc3NPZmZlcihzZHAsIGZ1bmN0aW9uIChlcnJvciwgc2RwQW5zd2VyKSB7XHJcbiAgICAgICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgc3RvcChpZCwgd3MpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG1hc3RlciA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgc3RvcChpZCwgd3MpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKFwiTm8gYWN0aXZlIHNlbmRlciBub3cuIEJlY29tZSBzZW5kZXIgb3IgLiBUcnkgYWdhaW4gbGF0ZXIgLi4uXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBtYXN0ZXIud2ViUnRjRW5kcG9pbnQuY29ubmVjdCh3ZWJSdGNFbmRwb2ludCwgZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdG9wKGlkLCB3cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobWFzdGVyID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RvcChpZCwgd3MpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhcIk5vIGFjdGl2ZSBzZW5kZXIgbm93LiBCZWNvbWUgc2VuZGVyIG9yIC4gVHJ5IGFnYWluIGxhdGVyIC4uLlwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgc2RwQW5zd2VyKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxudmFyIHNlbmRlcixcclxuICAgIHJlY2VpdmVycyA9IFtdO1xyXG5mdW5jdGlvbiByZW1vdmVSZWNlaXZlcihpZCkge1xyXG4gICAgaWYgKCFyZWNlaXZlcnNbaWRdKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdmFyIHJlY2VpdmVyID0gcmVjZWl2ZXJzW2lkXTtcclxuICAgIHJlY2VpdmVyLndlYlJ0Y0VuZHBvaW50LnJlbGVhc2UoKTtcclxuICAgIGRlbGV0ZSByZWNlaXZlcltpZF07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbW92ZVNlbmRlcigpIHtcclxuICAgIGlmIChzZW5kZXIgPT09IG51bGwpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaXggaW4gcmVjZWl2ZXJzKSB7XHJcbiAgICAgICAgcmVtb3ZlUmVjZWl2ZXIoaXgpO1xyXG4gICAgfVxyXG5cclxuICAgIHNlbmRlci53ZWJSdGNFbmRwb2ludC5yZWxlYXNlKCk7XHJcbiAgICBzZW5kZXIgPSBudWxsO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzdG9wKGlkLCB3cykge1xyXG4gICAgaWYgKG1hc3RlciAhPT0gbnVsbCAmJiBtYXN0ZXIuaWQgPT0gaWQpIHtcclxuICAgICAgICBmb3IgKHZhciBpeCBpbiB2aWV3ZXJzKSB7XHJcbiAgICAgICAgICAgIHZhciB2aWV3ZXIgPSB2aWV3ZXJzW2l4XTtcclxuICAgICAgICAgICAgaWYgKHZpZXdlci53cykge1xyXG4gICAgICAgICAgICAgICAgdmlld2VyLndzLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICAgICAgICAgIGlkOiAnc3RvcENvbW11bmljYXRpb24nXHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdmlld2VycyA9IHt9O1xyXG4gICAgICAgIHBpcGVsaW5lLnJlbGVhc2UoKTtcclxuICAgICAgICBwaXBlbGluZSA9IG51bGw7XHJcbiAgICAgICAgbWFzdGVyID0gbnVsbDtcclxuICAgIH0gZWxzZSBpZiAodmlld2Vyc1tpZF0pIHtcclxuICAgICAgICB2YXIgdmlld2VyID0gdmlld2Vyc1tpZF07XHJcbiAgICAgICAgaWYgKHZpZXdlci53ZWJSdGNFbmRwb2ludClcclxuICAgICAgICAgICAgdmlld2VyLndlYlJ0Y0VuZHBvaW50LnJlbGVhc2UoKTtcclxuICAgICAgICBkZWxldGUgdmlld2Vyc1tpZF07XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vQ2xhc3NlczpcclxuXHJcbmZ1bmN0aW9uIE1hc3RlcihpZCwgc3RyZWFtVXJsKSB7XHJcblxyXG4gICAgdGhpcy5pZCA9IGlkO1xyXG5cclxuICAgIHRoaXMuc3RyZWFtVXJsID0gc3RyZWFtVXJsO1xyXG5cclxuICAgIHZhciB2aWV3ZXJzID0gW107XHJcblxyXG4gICAgdmFyIHBpcGVsaW5lID0gbnVsbDtcclxuICAgIHZhciB3ZWJSdGNFbmRwb2ludCA9IG51bGw7XHJcblxyXG4gICAgdGhpcy5hZGRWaWV3ZXIgPSBmdW5jdGlvbiAodmlld2VyKSB7XHJcbiAgICAgICAgdmlld2Vycy5wdXNoKHZpZXdlcik7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmlzT2ZmbGluZSlcclxuICAgICAgICAgICAgc3RhcnRTdHJlYW0oKTsgLy9Ob3QgaW1wbGVtZW50ZWQgeWV0LiDQrdGC0LAg0YTRg9C90LrRhtC40Y8g0LTQvtC70LbQvdCwINC/0YDQvtGB0YLQsNCy0LvRj9GC0YwgcGlwZWxpbmVcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5yZW1vdmVWaWV3ZXIgPSBmdW5jdGlvbiAodmlld2VyKSB7XHJcbiAgICAgICAgdmFyIGluZGV4ID0gdmlld2Vycy5pbmRleE9mKHZpZXdlcik7XHJcbiAgICAgICAgaWYgKGluZGV4ID09IC0xKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHZpZXdlcnMuc3BsaWNlKGluZGV4LCAxKTtcclxuXHJcbiAgICAgICAgaWYgKCF2aWV3ZXJzLmxlbmd0aCAmJiB0aGlzLmlzT25saW5lKVxyXG4gICAgICAgICAgICBzdG9wU3RyZWFtKCk7IFxyXG4gICAgfTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XHJcbiAgICAgICAgc3RhdHVzOiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gISFwaXBlbGluZSA/ICdvbmxpbmUnIDogJ29mZmxpbmUnIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGlzT25saW5lOiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gISFwaXBlbGluZSB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpc09mZmxpbmU6IHtcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiAhcGlwZWxpbmUgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdmlld2Vyczoge1xyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHZpZXdlcnMgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBmdW5jdGlvbiBzdGFydFN0cmVhbSgpIHtcclxuICAgICAgICBpZiAoc2VsZi5pc09ubGluZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnV0FSTklORyEgVHJ5aW5nIHRvIHN0YXJ0IGFuIGFscmVhZHkgcnVubmluZyBzdHJlYW0nKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gc3RvcFByb2Nlc3NXaXRoRXJyb3IobWVzc2FnZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnRVJST1IhICcgKyBtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChwaXBlbGluZSlcclxuICAgICAgICAgICAgICAgIHBpcGVsaW5lLnJlbGVhc2UoKTtcclxuXHJcbiAgICAgICAgICAgIHBpcGVsaW5lID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmICh3ZWJSdGNFbmRwb2ludClcclxuICAgICAgICAgICAgICAgIHdlYlJ0Y0VuZHBvaW50LnJlbGVhc2UoKTtcclxuXHJcbiAgICAgICAgICAgIHdlYlJ0Y0VuZHBvaW50ID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBrdXJlbnRvQ2xpZW50ID0ga3VyZW50b0NsaWVudE1hbmFnZXIuZ2V0QXZhaWxhYmxlQ2xpZW50KCk7XHJcbiAgICAgICAgaWYgKCFrdXJlbnRvQ2xpZW50KVxyXG4gICAgICAgICAgICByZXR1cm4gc3RvcFByb2Nlc3NXaXRoRXJyb3IoJ1RyeWluZyB0byBzdGFydCBzdHJlYW0gd2hlbiBubyBvbmUga3VyZW50byBjbGllbnQgaXMgZXhpc3RzJyk7XHJcblxyXG4gICAgICAgIGt1cmVudG9DbGllbnQuY2xpZW50LmNyZWF0ZSgnTWVkaWFQaXBlbGluZScsIGZ1bmN0aW9uIChlcnJvciwgX3BpcGVsaW5lKSB7XHJcbiAgICAgICAgICAgIGlmIChlcnJvcilcclxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9wUHJvY2Vzc1dpdGhFcnJvcignQW4gZXJyb3Igb2NjdXJyZWQgd2hpbGUgbWFzdGVyIOKElicgKyBzZWxmLmlkICsgJyB0cnlpbmcgdG8gY3JlYXRlIG1lZGlhIHBpZWxpbmUnKTtcclxuXHJcbiAgICAgICAgICAgIHBpcGVsaW5lID0gX3BpcGVsaW5lO1xyXG4gICAgICAgICAgICBwaXBlbGluZS5jcmVhdGUoJ1dlYlJ0Y0VuZHBvaW50JywgZnVuY3Rpb24gKGVycm9yLCBfd2ViUnRjRW5kcG9pbnQpIHtcclxuICAgICAgICAgICAgICAgIGlmIChlcnJvcilcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RvcFByb2Nlc3NXaXRoRXJyb3IoJ0FuIGVycm9yIG9jY3VycmVkIHdoaWxlIG1hc3RlciDihJYnICsgc2VsZi5pZCArICcgdHJ5aW5nIHRvIGNyZWF0ZSBXZWJSdGMgZW5kcG9pbnQnKTtcclxuXHJcbiAgICAgICAgICAgICAgICB3ZWJSdGNFbmRwb2ludCA9IF93ZWJSdGNFbmRwb2ludDtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgc2RwID0gJ1dBQUFUJztcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign0YLRg9GCINC90LUg0LTQvtC/0LjQu9C10L0gc2RwJylcclxuICAgICAgICAgICAgICAgIHdlYlJ0Y0VuZHBvaW50LnByb2Nlc3NPZmZlcihzZHAsIGZ1bmN0aW9uIChlcnJvciwgc2RwQW5zd2VyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RvcFByb2Nlc3NXaXRoRXJyb3IoJ0FuIGVycm9yIG9jY3VycmVkIHdoaWxlIFdlYlJ0YyBlbmRwb2ludCBvZiBtYXN0ZXIg4oSWJyArIHNlbGYuaWQgKyAndHJ5aW5nIHRvIHByb2Nlc3Mgb2ZmZXInKTsgLy8/Pz9cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy/Qs9C00LUt0YLQviDRgtGD0YIg0L3QtdC00L7Qv9C40Lsg0YTRg9C90LrRhtC40L7QvdCw0LvRjNC90L7RgdGC0LguXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vY2FsbGJhY2sobnVsbCwgc2RwQW5zd2VyKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc3RvcFN0cmVhbSgpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCB5ZXQuINCt0YLQsCDRhNGD0L3QutGG0LjRjyDQtNC+0LvQttC90LAg0L/RgNC+0YHRgtCw0LLQu9GP0YLRjCBwaXBlbGluZSDQvdCwIG51bGwnKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gTWFzdGVyTWFuYWdlcigpIHtcclxuXHJcbiAgICB2YXIgbWFzdGVycyA9IFtdO1xyXG5cclxuICAgIHZhciBpZENvdW50ZXIgPSBuZXcgSWRDb3VudGVyKCk7XHJcblxyXG4gICAgdGhpcy5hZGRNYXN0ZXIgPSBmdW5jdGlvbiAobWFzdGVyKSB7XHJcbiAgICAgICAgbWFzdGVyLmlkID0gaWRDb3VudGVyLm5leHRVbmlxdWVJZDtcclxuICAgICAgICBtYXN0ZXJzLnB1c2gobWFzdGVyKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG1hc3Rlci5pZDtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmdldE1hc3RlckJ5SWQgPSBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICByZXR1cm4gbWFzdGVycy5maWx0ZXIoZnVuY3Rpb24gKG1hc3RlcikgeyByZXR1cm4gbWFzdGVyLmlkID09PSBpZCB9KVswXTtcclxuICAgIH1cclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XHJcbiAgICAgICAgbWFzdGVyczoge1xyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG1hc3RlcnMgfVxyXG4gICAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIEt1cmVudG9DbGllbnRNYW5hZ2VyKCkge1xyXG5cclxuICAgIHZhciBjbGllbnRDb3VudGVyID0gbmV3IElkQ291bnRlcigpO1xyXG5cclxuICAgIGZ1bmN0aW9uIEt1cmVudG9DbGllbnRXcmFwcGVyKGlkLCB1cmksIGNsaWVudCkge1xyXG4gICAgICAgIHRoaXMuaWQgPSBpZDtcclxuICAgICAgICB0aGlzLnVyaSA9IHVyaTtcclxuICAgICAgICB0aGlzLmNsaWVudCA9IGNsaWVudDtcclxuXHJcbiAgICAgICAgLy9JdCBpcyBtZWFuIGNvbm5lY3Rpb24gZnJvbSBjdXJyZW50IGFwcDpcclxuICAgICAgICB2YXIgbWFzdGVyQ29ubmVjdGlvbkNvdW50ID0gMDtcclxuICAgICAgICB2YXIgdmlld2VyQ29ubmVjdGlvbkNvdW50ID0gMDtcclxuICAgICAgICB0aGlzLmNvbm5lY3Rpb25Db3VudGVyID0ge1xyXG4gICAgICAgICAgICBwcm9jZXNzTWFzdGVyQ29ubmVjdGVkOiBmdW5jdGlvbiAoKSB7IG1hc3RlckNvbm5lY3Rpb25Db3VudCsrIH0sXHJcbiAgICAgICAgICAgIHByb2Nlc3NNYXN0ZXJEaXNjb25uZWN0ZWQ6IGZ1bmN0aW9uICgpIHsgbWFzdGVyQ29ubmVjdGlvbkNvdW50LS0gfSxcclxuICAgICAgICAgICAgcHJvY2Vzc1ZpZXZlckNvbm5lY3RlZDogZnVuY3Rpb24gKCkgeyB2aWV3ZXJDb25uZWN0aW9uQ291bnQrKyB9LFxyXG4gICAgICAgICAgICBwcm9jZXNzVmlldmVyRGlzY29uZWN0ZWQ6IGZ1bmN0aW9uICgpIHsgdmlld2VyQ29ubmVjdGlvbkNvdW50LS0gfSxcclxuICAgICAgICAgICAgZ2V0Q29ubmVjdGlvbkNvdW50OiBmdW5jdGlvbiAoKSB7IHJldHVybiAobWFzdGVyQ29ubmVjdGlvbkNvdW50ICsgdmlld2VyQ29ubmVjdGlvbkNvdW50KSB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICB2YXIgY2xpZW50cyA9IFtdXHJcblxyXG4gICAgdGhpcy5hZGRDbGllbnQgPSBmdW5jdGlvbiAoY2xpZW50VXJpLCBvblN1Y2Nlc3MsIG9uRXJyb3IpIHtcclxuICAgICAgICB2YXIgZXhpc3RpbmdDbGllbnQgPSBjbGllbnRzLmZpbHRlcihmdW5jdGlvbiAoY2xpZW50KSB7IHJldHVybiBjbGllbnQudXJpID09PSBjbGllbnRVcmkgfSlbMF07XHJcblxyXG4gICAgICAgIGlmIChleGlzdGluZ0NsaWVudClcclxuICAgICAgICAgICAgb25TdWNjZXNzKGV4aXN0aW5nQ2xpZW50LCAnVGhlIGNsaWVudCB3aXRoIHRoZSBzcGVjaWZpZWQgVXJpIGFscmVhZHkgZXhpc3RzJyk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBrdXJlbnRvKGNsaWVudFVyaSwgZnVuY3Rpb24gKGVycm9yLCBrdXJlbnRvQ2xpZW50KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9uRXJyb3IoZXJyb3IpXHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGlubmVyS3VycmVudG9DbGllbnQgPSBuZXcgS3VyZW50b0NsaWVudFdyYXBwZXIoY2xpZW50Q291bnRlci5uZXh0VW5pcXVlSWQsIGNsaWVudFVyaSwga3VyZW50b0NsaWVudCk7XHJcbiAgICAgICAgICAgICAgICBjbGllbnRzLnB1c2goaW5uZXJLdXJyZW50b0NsaWVudCk7XHJcbiAgICAgICAgICAgICAgICBvblN1Y2Nlc3MoaW5uZXJLdXJyZW50b0NsaWVudCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZ2V0Q2xpZW50QnlJZCA9IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgIHJldHVybiBjbGllbnRzLmZpbHRlcihmdW5jdGlvbiAoY2xpZW50KSB7IHJldHVybiBjbGllbnQuaWQgPT09IGlkIH0pWzBdO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZ2V0QXZhaWxhYmxlQ2xpZW50ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBjbGllbnRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEuY29ubmVjdGlvbkNvdW50ZXIuZ2V0Q29ubmVjdGlvbkNvdW50KCkgLSBiLmNvbm5lY3Rpb25Db3VudGVyLmdldENvbm5lY3Rpb25Db3VudCgpIH0pWzBdO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMucmVtb3ZlQ2xpZW50QnlJZCA9IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgIHZhciBjbGllbnQgPSBjbGllbnRzLmZpbHRlcihmdW5jdGlvbiAoY2xpZW50KSB7IHJldHVybiBjbGllbnQuaWQgPT09IGlkIH0pWzBdO1xyXG5cclxuICAgICAgICBpZiAoIWNsaWVudClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLnZpZXdlcnMuc3BsaWNlKGNsaWVudHMuaW5kZXhPZihjbGllbnQpLCAxKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gQWN0aW9uUmVzcG9uc2Uoc3RhdHVzLCBtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICB0aGlzLnN0YXR1cyA9IHN0YXR1cztcclxuICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XHJcbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xyXG59XHJcblxyXG52YXIgc3RhdHVzZXMgPSB7XHJcbiAgICBzdWNjZXNzOiAnU3VjY2VzcycsXHJcbiAgICBlcnJvcjogJ0Vycm9yJ1xyXG59XHJcblxyXG5hcHAudXNlKGV4cHJlc3Muc3RhdGljKHBhdGguam9pbihfX2Rpcm5hbWUsICdzdGF0aWMnKSkpO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=