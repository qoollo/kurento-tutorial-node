
declare module Protocol {

    interface IClientId {
        clientId: number;
    }

    interface IConnectToStreamResponse {
        clientId: IClientId;
        streamUrl: string;
        sdpAnswer: string;
    }

}