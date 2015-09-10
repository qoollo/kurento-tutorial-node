/// <reference path="./webrtc-adapter.d.ts" />

declare module Kurento.Utils {

    interface IWebRtcPeer {
        pc: IRTCPeerConnection;
        localVideo: HTMLVideoElement;
        remoteVideo: HTMLVideoElement;
        onerror: (err) => void;
        stream;
        audioStream;
        mode: string;
        onsdpoffer: (sdpOffer: string) => void;

        start(server, options): void;
        dispose(): void;
        processSdpAnswer(sdpAnswer: string, successCallback?): void;

        userMediaConstraints: {
            audio: boolean,
            video: {
                mandatory: {
                    maxWidth: number,
                    maxFrameRate: number,
                    minFrameRate: number
                }
            }
        };
        server: {
            iceServers: any
        };
        options: {
            optional: [{
                DtlsSrtpKeyAgreement: boolean
        }]
    };
    }

    interface IWebRtcPeerConstructor {
        new (mode, localVideo, remoteVideo, onsdpoffer: (sdpOffer: string) => void, onerror, videoStream, audioStream): IWebRtcPeer;
        start(mode, localVideo, remoteVideo, onSdp: (sdpOffer: string) => void, onerror, mediaConstraints, videoStream, audioStream, server, options): IWebRtcPeer;
        startRecvOnly(remoteVideo: HTMLVideoElement, onSdp?: (sdpOffer: string) => void, onError?, mediaConstraints?, server?, options?): IWebRtcPeer;
        startSendOnly(localVideo: HTMLVideoElement, onSdp: (sdpOffer: string) => void, onError, mediaConstraints?, server?, options?): IWebRtcPeer;
        startSendRecv(localVideo: HTMLVideoElement, remoteVideo: HTMLVideoElement, onSdp: (sdpOffer: string) => void, onError, mediaConstraints?, server?, options?): IWebRtcPeer;
    }

    interface IKurentoUtils {
        WebRtcPeer: IWebRtcPeerConstructor
    }

}

declare var kurentoUtils: Kurento.Utils.IKurentoUtils;