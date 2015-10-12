
declare module crossbar {

    export module config {

        interface ICrossbarConfig {
            controller: {
            };
            workers: ICrossbarWorker[];
        }

        interface ICrossbarWorker {
            id?: string;
            type: string;
        }

        interface IRealm {
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
            type: string;
            port: number;
        }
    }
}