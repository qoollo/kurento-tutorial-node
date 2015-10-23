
declare module Protocol {

    interface IKurentoHubVersion {
        version: string;
        capabilities: {
            authorization: boolean;
        };
    }

    interface IClientId {
        clientId: number;
    }

    interface IConnectToStreamResponse {
        clientId: IClientId;
        streamUrl: string;
        sdpAnswer: string;
    }
    
    interface IStreamsToRunChangedEventArgs {
        StreamsToRun: IVideoStream[]
    }
    
    interface IVideoStream {
        Url: string;
    }

}