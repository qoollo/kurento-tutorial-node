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

import ConsoleWrapper = require('./Console')
var KurentoVideoConsumer = require('./KurentoVideoConsumer.js')

var ws,
    video,
    webRtcPeer,
    streamUrl = 'rtsp://10.5.5.85/media/video1',
    client,
    crossbarConfig = {
        "type": "web",
        "endpoint": {
            "type": "tcp",
            "port": 8080
        },
        "paths": {
            "/": {
                "type": "static",
                "directory": "../web"
            },
            "ws": {
                "type": "websocket"
            },
            "kurentoHub": {
                "type": "websocket",
                "auth": {
                    "wampcra": {
                        "type": "static",
                        "users": {
                            "KurentoHub": {
                                "secret": "secret2",
                                "role": "KurentoHub"
                            },
                            "VideoConsumer": {
                                "secret": "prq7+YkJ1/KlW1X0YczMHw==",
                                "role": "VideoConsumer",
                                "salt": "salt123",
                                "iterations": 100,
                                "keylen": 16
                            }
                        }
                    }
                }
            }
        }
    };

window.onload = function () {
    console = <any>(new ConsoleWrapper('console', console));
    video = document.getElementById('video');

    var address = (<HTMLInputElement>document.getElementById('app-server-address')).value;

    client = new KurentoVideoConsumer(address.substring(0, address.lastIndexOf(':')), console);
    client.playStream();
    return;

    ws = new WebSocket('ws://' + address + '/control');
    ws.onmessage = function (message) {
        var parsedMessage = JSON.parse(message.data);
        console.info('Received message: ' + message.data);

        switch (parsedMessage.id) {
            case 'masterResponse':
                handleMasterResponse(parsedMessage);
                break;
            case 'viewerResponse':
                handleViewerResponse(parsedMessage);
                break;
            case 'stopCommunication':
                dispose();
                break;
            default:
                debugger;
                if (parsedMessage.data && parsedMessage.data.rpc == 'AddViewerResponse')
                    webRtcPeer.processSdpAnswer(parsedMessage.data.sdpAnswer, function () {
                        console.info('SdpAnswer processed');
                    });
                else
                    console.error('Unrecognized message', parsedMessage);
        }
    }

    document.getElementById('call').onclick = onMasterClick;
    document.getElementById('viewer').onclick = onViewerClick;
    document.getElementById('terminate').onclick = onTerminateClick;
}

window.onbeforeunload = function () {
    if (client)
        client.dispose();
    if (ws)
        ws.close();
}

function handleMasterResponse(message) {
    if (message.response != 'accepted') {
        var errorMsg = message.message ? message.message : 'Unknow error';
        console.info('Call not accepted for the following reason: ' + errorMsg);
        dispose();
    } else {
        webRtcPeer.processSdpAnswer(message.sdpAnswer);
    }
}

function handleViewerResponse(message) {
    if (message.response != 'accepted') {
        var errorMsg = message.message ? message.message : 'Unknow error';
        console.info('Call not accepted for the following reason: ' + errorMsg);
        dispose();
    } else {
        webRtcPeer.processSdpAnswer(message.sdpAnswer);
    }
}

function onMasterClick() {
    var message = {
        rpc: 'AddMaster',
        params: {
            streamUrl: streamUrl
        }
    };
    sendMessage(message);

    return false;
}

function onViewerClick() {
    if (!webRtcPeer) {
        showSpinner(video);

        webRtcPeer = kurentoUtils.WebRtcPeer.startRecvOnly(video, function (offerSdp) {
            var message = {
                rpc: 'AddViewer',
                params: {
                    sdpOffer: offerSdp,
                    streamUrl: streamUrl
                }
            };
            sendMessage(message);
        });
    }

    return false;
}

function onTerminateClick() {
    var message = {
        id: 'stop'
    }
    sendMessage(message);
    dispose();

    return false;
}

function dispose() {
    if (webRtcPeer) {
        webRtcPeer.dispose();
        webRtcPeer = null;
    }
    hideSpinner(video);
}

function sendMessage(message) {
    var jsonMessage = JSON.stringify(message);
    console.log('Senging message: ' + jsonMessage);
    ws.send(jsonMessage);
}

function showSpinner(...elements: HTMLVideoElement[]) {
    elements.forEach(e => {
        e.poster = './img/transparent-1px.png';
        e.style.background = 'center transparent url("./img/spinner.gif") no-repeat';
    });
}

function hideSpinner(...elements: HTMLVideoElement[]) {
    elements.forEach(e => {
        e.src = '';
        e.poster = './img/webrtc.png';
        e.style.background = '';
    });
}

/**
 * Lightbox utility (to display media pipeline image in a modal dialog)
 */
$(document).delegate('*[data-toggle="lightbox"]', 'click', function (event) {
    event.preventDefault();
    (<any>$(this)).ekkoLightbox();
});