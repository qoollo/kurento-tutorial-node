
declare module Kurento.Client {

    interface IMediaObject {
        /**
         * Childs of current object, all returned objects have parent set to current object
         *
         * @alias module:core/abstracts.MediaObject#getChilds
         *
         * @param {module:core/abstracts.MediaObject~getChildsCallback} [callback]
         *
         * @return {external:Promise}
         */
        getChilds(callback: (err, result: IMediaObject[]) => void): Promise<IMediaObject[]>;

        /**
         * {@link module:core.MediaPipeline MediaPipeline} to which this MediaObject belong, or the pipeline itself if invoked over a {@link module:core.MediaPipeline MediaPipeline}
         *
         * @alias module:core/abstracts.MediaObject#getMediaPipeline
         *
         * @param {module:core/abstracts.MediaObject~getMediaPipelineCallback} [callback]
         *
         * @return {external:Promise}
         */
        getMediaPipeline(callback: (err, result: IMediaPipeline) => void): Promise<IMediaPipeline>;

        /**
         * Object name. This is just a comodity to simplify developers life debugging, it is not used internally for indexing nor idenfiying the objects. By default is the object type followed by the object id.
         *
         * @alias module:core/abstracts.MediaObject#getName
         *
         * @param {module:core/abstracts.MediaObject~getNameCallback} [callback]
         *
         * @return {external:Promise}
         */
        getName(callback: (err, result: string) => void): Promise<string>;

        /**
         * parent of this media object. The type of the parent depends on the type of the element. The parent of a :rom:cls:`MediaPad` is its {@link module:core/abstracts.MediaElement MediaElement}; the parent of a {@link module:core/abstracts.Hub Hub} or a {@link module:core/abstracts.MediaElement MediaElement} is its {@link module:core.MediaPipeline MediaPipeline}. A {@link module:core.MediaPipeline MediaPipeline} has no parent, i.e. the property is null
         *
         * @alias module:core/abstracts.MediaObject#getParent
         *
         * @param {module:core/abstracts.MediaObject~getParentCallback} [callback]
         *
         * @return {external:Promise}
         */
        getParent(callback: (err, result: IMediaObject) => void): Promise<IMediaObject>;

        /**
         * Explicity release a {@link module:core/abstract.MediaObject MediaObject} from memory
         *
         * All its descendants will be also released and collected
         *
         * @param {module:core/abstract.MediaObject~releaseCallback} callback
         *
         * @return {external:Promise}
         */
        release(callback?: (err) => void): Promise<void>;

        commited: boolean;

        then(onFulfilled, onRejected): Promise<any>;
    }

    interface IMediaPipeline extends IMediaObject {
        /**
         * Create a new instance of a {module:core/abstract.MediaObject} attached to
         *  this {module:core.MediaPipeline}
         *
         * @param {external:String} type - Type of the
         *  {module:core/abstract.MediaObject}
         * @param {external:String[]} [params]
         * @param {module:core.MediaPipeline~createCallback} callback
         *
         * @return {external:Promise}
         */
        create(type: string, params: any, callback: (err, result: IMediaObject) => void): Promise<IMediaObject>;
        create(type: string, callback: (err, result: IMediaObject) => void): Promise<IMediaObject>;
        create(type: 'WebRtcEndpoint', callback: (err, result: IWebRtcEndpoint) => void): Promise<IWebRtcEndpoint>;
        create(type: 'GStreamerFilter', params: any, callback: (err, result: IGStreamerFilter) => void): Promise<IGStreamerFilter>;
        
    }

    interface IMediaElement extends IMediaObject {
        /**
         * Connects two elements, with the given restrictions, current {@link module:core/abstracts.MediaElement MediaElement} will start emmit media to sink element. Connection could take place in the future, when both media element show capabilities for connecting with the given restrictions
         *
         * @alias module:core/abstracts.MediaElement.connect
         *
         * @param {module:core/abstracts.MediaElement} sink
         *  the target {@link module:core/abstracts.MediaElement MediaElement} that will receive media
         *
         * @param {module:core/complexTypes.MediaType} [mediaType]
         *  the {@link MediaType} of the pads that will be connected
         *
         * @param {external:String} [sourceMediaDescription]
         *  A textual description of the media source. Currently not used, aimed mainly for {@link module:core/abstracts.MediaElement#MediaType.DATA} sources
         *
         * @param {external:String} [sinkMediaDescription]
         *  A textual description of the media source. Currently not used, aimed mainly for {@link module:core/abstracts.MediaElement#MediaType.DATA} sources
         *
         * @param {module:core/abstracts.MediaElement~connectCallback} [callback]
         *
         * @return {external:Promise}
         */
        connect(sink: IMediaElement, mediaType: string, sourceMediaDescription: string, sinkMediaDescription: string, callback: (err) => void): Promise<void>;
        connect(sink: IMediaElement, callback: (err) => void): Promise<void>;
    }

    interface IEndpoint extends IMediaElement {
    }

    interface ISessionEndpoint extends IEndpoint {
    }

    interface IHttpEndpoint extends ISessionEndpoint {
    }

    interface ISdpEndpoint extends ISessionEndpoint {
        /**
         * Request the NetworkConnection to process the given SessionSpec offer (from the remote User Agent)
         *
         * @alias module:core/abstracts.SdpEndpoint.processOffer
         *
         * @param {external:String} offer
         *  SessionSpec offer from the remote User Agent
         *
         * @param {module:core/abstracts.SdpEndpoint~processOfferCallback} [callback]
         *
         * @return {external:Promise}
         */
        processOffer(offer: string, callback: (err, result: string) => void): Promise<string>;
    }

    interface IBaseRtpEndpoint extends ISdpEndpoint {
    }

    interface IWebRtcEndpoint extends IBaseRtpEndpoint {
    }

    interface IFilter extends IMediaElement {
    }

    interface IGStreamerFilter extends IFilter {
    }

    interface IZBarFilter extends IFilter {
    }

    interface IOpenCVFilter extends IFilter {
    }

    interface IServerManager {
    }
    
    interface IKurentoClient {
        /**
         * Create a new instance of a MediaObject
         *
         * @param {external:String} type - Type of the element
         * @param {external:string[]} [params]
         * @callback {createMediaPipelineCallback} callback
         *
         * @return {module:KurentoClientApi~KurentoClient} The Kurento client itself
         */
        create(type: string, callback: (err, result: IMediaPipeline) => void): IKurentoClient;

        /**
         * Connect the source of a media to the sink of the next one
         *
         * @param {...module:core/abstract~MediaObject} media - A media to be connected
         * @callback {module:KurentoClientApi~connectCallback} [callback]
         *
         * @return {external:Promise}
         *
         * @throws {SyntaxError}
         */
        connect(media: IMediaObject, callback: (err) => void): Promise<void>;

        /**
         * Get a reference to the current Kurento Media Server we are connected
         *
         * @callback {module:KurentoClientApi~getServerManagerCallback} callback
         *
         * @return {external:Promise}
         */
        getServerManager(callback: (err, result: IServerManager) => void): Promise<IServerManager>;
    }

    interface IKurentoClientOptions {
        /** Don't try to reconnect after several tries. Default is 5. */
        failAfter: number;
        /** Enable transactions functionality. Default is true. */
        enableTransactions: boolean;
        /** Set access token for the WebSocket connection. */
        access_token;
        /** Number of tries to send the requests. */
        max_retries: number;
        /** Timeout between requests retries. Default is 20000 */
        request_timeout: number;
        /** Timeout while a response is being stored. Default is 20000 */
        response_timeout: number;
        /** Timeout to ignore duplicated responses. Default is 20000 */
        duplicates_timeout: number
    }

    interface IKurentoClientConstructor {
        /**
         * @param {String} ws_uri - Address of the Kurento Media Server
         */
        new (ws_uri: string, options: IKurentoClientOptions, callback: (err, result: IKurentoClient) => void): IKurentoClient;
        /**
         * @param {String} ws_uri - Address of the Kurento Media Server
         */
        new (ws_uri: string, callback: (err, result: IKurentoClient) => void): IKurentoClient;
        checkType;
        MediaObjectCreator;
        register;
        TransactionsManager;
    }
        
}

declare var kurentoClient: Kurento.Client.IKurentoClientConstructor;

