
declare module Protocol {

    interface IClientId {
        clientId: number;
    }

    interface IConnectToStreamResponse {
        clientId: number;
        streamUrl: string;
        sdpAnswer: string;
    }

}