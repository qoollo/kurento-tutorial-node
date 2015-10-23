
import fs = require('fs');
import path = require('path');

export enum EnvMode {
    Development,
    Production
}

var configFilePath = path.join(path.dirname(require.main.filename), 'KurentoHub.config.json'),
    defaultConfig = {
        mode: EnvMode.Development,
        
        version: <Protocol.IKurentoHubVersion>{
            version: '0.1.0',        
            capabilities: {
                authorization: false
            }
        },
    
        kurentoMediaServer: {
    
            wsUrlTemplate: 'ws://${domain}:8888/kurento',
            
            defaultInstances: [
                {
                    domain: '10.5.6.119'
                }
            ]
        },
    
        mongodb: {
            uri: 'mongodb://localhost/kurento-app-server',  
        },    
    
        monit: {
            login: 'admin',
            password: 'monit',
            txtPath: '/_status',
            xmlPath: '/_status?format=xml'
        }
    },
    actualConfig = defaultConfig;
    
if (fs.existsSync(configFilePath)) 
    actualConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
else
    fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 4), { encoding: 'utf8' });

function configFileExists(): boolean {
    return fs.existsSync(configFilePath);
    }

export var config = actualConfig;
