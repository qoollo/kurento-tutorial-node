
declare module Kurento.Utils {

    interface IWebRtcPeer {
        pc;
        localVideo;
        remoteVideo;
        onerror;
        stream;
        audioStream;
        mode;
        onsdpoffer;

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
        new (mode, localVideo, remoteVideo, onsdpoffer, onerror, videoStream, audioStream): IWebRtcPeer;
        start(mode, localVideo, remoteVideo, onSdp, onerror, mediaConstraints, videoStream, audioStream, server, options): IWebRtcPeer;
        startRecvOnly(remoteVideo: HTMLVideoElement, onSdp, onError, mediaConstraints?, server?, options?): IWebRtcPeer;
        startSendOnly(localVideo: HTMLVideoElement, onSdp, onError, mediaConstraints?, server?, options?): IWebRtcPeer;
        startSendRecv(localVideo: HTMLVideoElement, remoteVideo: HTMLVideoElement, onSdp, onError, mediaConstraints?, server?, options?): IWebRtcPeer;
    }

    interface IKurentoUtils {
        WebRtcPeer: IWebRtcPeerConstructor
    }

}

declare var kurentoUtils: Kurento.Utils.IKurentoUtils;