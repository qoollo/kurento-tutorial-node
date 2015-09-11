
module CitySoft {

    export class StreamingSettings {
        /**
         *  @param {String} kurentoWsUrl Web Socket URL of Kurento Media Server, e.g. 'ws://10.5.6.119:8888/kurento'
         */
        constructor(
            public kurentoWsUri: string,
            public rtspUrl: string,
            public iceServers: string = null) {
        }
    }
}