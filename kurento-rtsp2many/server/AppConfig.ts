
import fs = require('fs');
import path = require('path');

export enum EnvMode {
    Development = 0,
    Production = 1,
    Test = 2,
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

        monit: {
            login: 'admin',
            password: 'monit',
            txtPath: '/_status',
            xmlPath: '/_status?format=xml'
        }
    },
    actualConfig = defaultConfig;

class AppConfigProvider {

    private initialized: boolean = false;

    public get() {
        if (!this.initialized) {
            this.initialized = true;
            this.initialize();
        }

        return actualConfig;
    }

    public setEnvMode(value: EnvMode): void {
        defaultConfig.mode = value;
    }

    private initialize(): void {
        if (defaultConfig.mode != EnvMode.Test) {
            if (fs.existsSync(configFilePath))
                actualConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
            else
                fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 4), { encoding: 'utf8' });
        }
    }

}

export var config = new AppConfigProvider();
