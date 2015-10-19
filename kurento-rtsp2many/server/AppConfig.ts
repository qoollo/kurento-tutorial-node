
export enum EnvMode {
    Development,
    Production
}

export var config = {
    mode: EnvMode.Development,

    kurentoMediaServer: {
        wsUrlTemplate: (domain: string): string => `ws://${domain}:8888/kurento`,
        defaultInstances: [
            {
                domain: '10.5.6.119'
            }
        ]
    }
};