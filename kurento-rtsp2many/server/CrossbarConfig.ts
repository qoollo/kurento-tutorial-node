
import fs = require('fs');
import path = require('path');
import logger = require('./Logger');
import WampWebTransportConfiguration = require('./Wamp/Transport/WampWebTransportConfiguration');

class CrossbarConfig {

    public read(): Promise<crossbar.config.ICrossbarConfig> {
        return new Promise((resolve, reject) => {
            var path = this.getConfigFilePath();
            fs.readFile(path, 'utf8', (err, content) => {
                if (err)
                    return reject(err);
                resolve(this.parseConfigFile(content));
            });
        }); 
    }

    public readSync(): crossbar.config.ICrossbarConfig {
        var path = this.getConfigFilePath(),
            content = fs.readFileSync(path, 'utf8'),
            json = this.parseConfigFile(content);
        return json;
    }

    public getKurentoHubUrl(): Promise<string> {
        return this.read()
            .then(cfg => {
                var config = new WampWebTransportConfiguration(<crossbar.config.IWebTransport>(<crossbar.config.ICrossbarRouter>cfg.workers[0]).transports[0]);
                return config.getUrl('127.0.0.1', 'kurentoHub');
            });
    }

    private getConfigFilePath(): string {
        var appRoot = path.dirname(require.main.filename),
            configPath = path.join(appRoot, '..', '.crossbar', 'config.json');
        if (!fs.existsSync(configPath)) {
            var err = 'CrossbarConfig.getConfigFilePath() failed to locate Crossbar.io configuration file. Searched location: ' + configPath;
            logger.error(err);
            throw new Error(err)
        }
        return configPath;
    }

    private parseConfigFile(content: string): crossbar.config.ICrossbarConfig {
        try {
            return JSON.parse(content);
        } catch (e) {
            logger.error('CrossbarConfig.parseConfigFile() failed to parse Crossbar.io configuration file.', e);
            throw e; 
        }
    }
}



export = CrossbarConfig;