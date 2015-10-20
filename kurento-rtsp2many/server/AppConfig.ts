
export enum EnvMode {
    Development,
    Production
}

export var config = {
    mode: EnvMode.Development,
    
    version: <Protocol.IKurentoHubVersion>{
        version: '0.1.0',        
        capabilities: {
            authorization: false
        }
    },

    kurentoMediaServer: {
        wsUrlTemplate: (domain: string): string => `ws://${domain}:8888/kurento`,
        defaultInstances: [
            {
                domain: '10.5.6.119'
            }
        ]
    },
    
    mongo: {
      uri: 'mongodb://localhost/kurento-app-server',  
    }
};