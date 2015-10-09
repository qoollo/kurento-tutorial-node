
import fs = require('fs');
import path = require('path');
import logger = require('./Logger');

class CrossbarConfig {

    public read(): Promise<ICrossbarConfig> {
        return new Promise((resolve, reject) => {
            var path = this.getConfigFilePath();
            fs.readFile(path, 'utf8', (err, content) => {
                if (err)
                    return reject(err);
                resolve(this.parseConfigFile(content));
            });
        }); 
    }

    public readSync(): ICrossbarConfig {
        var path = this.getConfigFilePath(),
            content = fs.readFileSync(path, 'utf8'),
            json = this.parseConfigFile(content);
        return json;
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

    private parseConfigFile(content: string): ICrossbarConfig {
        try {
            return JSON.parse(content);
        } catch (e) {
            logger.error('CrossbarConfig.parseConfigFile() failed to parse Crossbar.io configuration file.', e);
            throw e; 
        }
    }
}

interface ICrossbarConfig {
    controller: {
    };
    workers: ICrossbarWorker[];
}

interface ICrossbarWorker {
    id?: string;
    type: string;
}

/** http://crossbar.io/docs/Router-Configuration/ */
interface ICrossbarRouter extends ICrossbarWorker {
    options?: IRouterOrContainerOptions;
    manhole?;
    realms: IRouterRealm[];
    transports: IRouterTransport[];
    components?;
    connections?;
}

/** http://crossbar.io/docs/Container-Configuration/ */
interface ICrossbarContainer extends ICrossbarWorker {
    options?: IRouterOrContainerOptions;
    manhole?;
    components?;
    connections?;
}

/** http://crossbar.io/docs/Guest-Configuration/ */
interface ICrossbarGuest extends ICrossbarWorker {
    executable: string;
    arguments?: string[];
    options?: IGuestOptions;
}

/** http://crossbar.io/docs/Native-Worker-Options/ */
interface IWorkerOptions {
    
    env?: ICrossbarProcessEnvironment;
}

interface IRouterOrContainerOptions extends IWorkerOptions {
    title?: string;
    python?: string;
    pythonpath?: string[];
    cpu_affinity?: number[];
    reactor?: string;
}

/** http://crossbar.io/docs/Guest-Configuration/ */
interface IGuestOptions extends IWorkerOptions {
    env?: ICrossbarProcessEnvironment;
    workdir?: string;
    stdin?: Object;
    stdout?: string;
    stderr?: string;
    watch?: Object
}

/** http://crossbar.io/docs/Process-Environments/ */
interface ICrossbarProcessEnvironment {
    inherit?: boolean;
    vars?: Object;
}

interface IRouterRealm {
    //  TODO
}

/** http://crossbar.io/docs/Router-Transports/ */
interface IRouterTransport {
}

interface IWebSocketTransport extends IRouterTransport {
    //  TODO
}

interface IRawSocketTransport extends IRouterTransport {
    //  TODO
}

/** http://crossbar.io/docs/Web-Transport-and-Services/ */
interface IWebTransport extends IRouterTransport {
    id?: number;
    type: string;
    endpoint: ITransportEndpoint;
    paths: Object;
    options?: Object;
}

/** http://crossbar.io/docs/Transport-Endpoints/ */
interface ITransportEndpoint {
}

export = CrossbarConfig;