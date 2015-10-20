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

import ConsoleWrapper = require('./Console');
import KurentoVideoConsumer = require('./KurentoVideoConsumer');

var ws,
    video,
    webRtcPeer,
    streamUrl = 'rtsp://10.5.5.85/media/video1',
    client,
    playerComponents: PlayerComponent[] = [];
    
class PlayerComponent {
    constructor(private container: Element) {
        this.videoElement = container.getElementsByTagName('video')[0];
        this.videoElement.onplay = e => this.onPlay();
        this.urlInputElement = container.getElementsByTagName('input')[0];
    }
    
    private videoElement: HTMLVideoElement;
    private urlInputElement: HTMLInputElement; 
    
    private onPlay() {
        var url = this.urlInputElement.value,
            client = getKurentoVideoConsumer();
        client.playStream(url)
            .then(player => this.videoElement.src = player.src);
    }
}

function getKurentoVideoConsumer(): KurentoVideoConsumer {
    if (!client) {
        var address = (<HTMLInputElement>document.getElementById('wamp-router-domain')).value;
        client = new KurentoVideoConsumer(address.substring(0, address.lastIndexOf(':')), console);
    }
    return client;    
}

window.onload = function () {
    console = <any>(new ConsoleWrapper('console', console));    
    var elements = document.getElementsByClassName('video-component');
    for (var i = 0; i < elements.length; i++)
        playerComponents.push(new PlayerComponent(elements[i]));
     
    return;

    var address = (<HTMLInputElement>document.getElementById('wamp-router-domain')).value;
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
