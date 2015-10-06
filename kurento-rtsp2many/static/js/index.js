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

var ws,
    video,
    webRtcPeer,
    streamUrl = 'rtsp://10.5.5.85/media/video1';

window.onload = function() {
	console = new Console('console', console);
	video = document.getElementById('video');

	var address = document.getElementById('app-server-address').value;
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

		webRtcPeer = kurentoUtils.WebRtcPeer.startRecvOnly(video, function(offerSdp) {
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
		id : 'stop'
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

function showSpinner() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].poster = './img/transparent-1px.png';
		arguments[i].style.background = 'center transparent url("./img/spinner.gif") no-repeat';
	}
}

function hideSpinner() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].src = '';
		arguments[i].poster = './img/webrtc.png';
		arguments[i].style.background = '';
	}
}

/**
 * Lightbox utility (to display media pipeline image in a modal dialog)
 */
$(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
	event.preventDefault();
	$(this).ekkoLightbox();
});
