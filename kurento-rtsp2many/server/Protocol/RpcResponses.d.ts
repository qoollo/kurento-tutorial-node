
declare module Protocol {

    interface IRegisterResponse {
        clientId: number;
    }

    interface IConnectToStreamResponse {
        clientId: number;
        streamUrl: string;
        sdpAnswer: string;
    }

}