
interface IRTCPeerConnection {
}

interface IRTCSessionDescription {
}

interface IRTCIceCandidate {
}

declare var getUserMedia: (constraints, onSuccess, onError) => Object;
declare var attachMediaStream: (element, stream) => void;
declare var reattachMediaStream: (to, from) => void;
declare var webrtcDetectedBrowser: string;
declare var webrtcDetectedVersion: number;
declare var webrtcMinimumVersion: number;
declare var webrtcUtils: {
    log: () => void
};
declare var RTCPeerConnection: IRTCPeerConnection;
declare var RTCSessionDescription: IRTCSessionDescription;
declare var RTCIceCandidate: IRTCIceCandidate;