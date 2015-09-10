
declare module Kurento.Client {

    interface ICallback<T> {
        (err: any, result: T): void;
    }

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
        getChilds(callback: ICallback<IMediaObject>): Promise<IMediaObject[]>;

        /**
         * {@link module:core.MediaPipeline MediaPipeline} to which this MediaObject belong, or the pipeline itself if invoked over a {@link module:core.MediaPipeline MediaPipeline}
         *
         * @alias module:core/abstracts.MediaObject#getMediaPipeline
         *
         * @param {module:core/abstracts.MediaObject~getMediaPipelineCallback} [callback]
         *
         * @return {external:Promise}
         */
        getMediaPipeline(callback: ICallback<IMediaPipeline>): Promise<IMediaPipeline>;

        /**
         * Object name. This is just a comodity to simplify developers life debugging, it is not used internally for indexing nor idenfiying the objects. By default is the object type followed by the object id.
         *
         * @alias module:core/abstracts.MediaObject#getName
         *
         * @param {module:core/abstracts.MediaObject~getNameCallback} [callback]
         *
         * @return {external:Promise}
         */
        getName(callback: ICallback<string>): Promise<string>;

        /**
         * parent of this media object. The type of the parent depends on the type of the element. The parent of a :rom:cls:`MediaPad` is its {@link module:core/abstracts.MediaElement MediaElement}; the parent of a {@link module:core/abstracts.Hub Hub} or a {@link module:core/abstracts.MediaElement MediaElement} is its {@link module:core.MediaPipeline MediaPipeline}. A {@link module:core.MediaPipeline MediaPipeline} has no parent, i.e. the property is null
         *
         * @alias module:core/abstracts.MediaObject#getParent
         *
         * @param {module:core/abstracts.MediaObject~getParentCallback} [callback]
         *
         * @return {external:Promise}
         */
        getParent(callback: ICallback<IMediaObject>): Promise<IMediaObject>;

        /**
         * Explicity release a {@link module:core/abstract.MediaObject MediaObject} from memory
         *
         * All its descendants will be also released and collected
         *
         * @param {module:core/abstract.MediaObject~releaseCallback} callback
         *
         * @return {external:Promise}
         */
        release(callback?: ICallback<void>): Promise<void>;

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
        create(type: string, params?: Object, callback?: ICallback<IMediaObject>): Promise<IMediaObject>;
        //create(type: string, callback: ICallback<IMediaObject>): Promise<IMediaObject>;
        create(type: 'WebRtcEndpoint', callback?: ICallback<IWebRtcEndpoint>): Promise<IWebRtcEndpoint>;
        create(
            type: 'GStreamerFilter',
            params: {
                command: string,
                filterType?: string
            },
            callback?: ICallback<IGStreamerFilter>): Promise<IGStreamerFilter>;
        create(
            type: 'PlayerEndpoint',
            params: {
                uri: string;
                useEncodedMedia?: boolean;
            },
            callback?: ICallback<IPlayerEndpoint>): Promise<IPlayerEndpoint>;

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
        connect(sink: IMediaElement, mediaType: string, sourceMediaDescription: string, sinkMediaDescription: string, callback: ICallback<void>): Promise<void>;
        connect(sink: IMediaElement, callback?: ICallback<void>): Promise<void>;
    }


    /**
     *  Base interface for all end points. An Endpoint is a {@link module:core/abstracts.MediaElement MediaElement}
     *  that allow <a href="http://www.kurento.org/docs/current/glossary.html#term-kms">KMS</a> to interchange media contents with external systems,
     *  supporting different transport protocols and mechanisms, such as <a href="http://www.kurento.org/docs/current/glossary.html#term-rtp">RTP</a>,
     *  <a href="http://<a href="http://www.kurento.org/docs/current/glossary.html#term-http">HTTP</a>org/docs/current/glossary.html#term-webrtc">WebRTC</a>, :term:`HTTP`, <code>file:/</code> URLs... An <code>Endpoint</code> may
     *  contain both sources and sinks for different media types, to provide
     *  bidirectional communication.
    */
    interface IEndpoint extends IMediaElement {
    }

    /**
     * Session based endpoint. A session is considered to be started when the media exchange starts. On the other hand, sessions terminate when a timeout, defined by the developer, takes place after the connection is lost.
     */
    interface ISessionEndpoint extends IEndpoint {
    }

    /**
     * Endpoint that enables Kurento to work as an HTTP server, allowing peer HTTP clients to access media.
     */
    interface IHttpEndpoint extends ISessionEndpoint {
        /**
         * Obtains the URL associated to this endpoint
         */
        getUrl(callback: ICallback<string>): Promise<string>;
    }

    /**
     *  An <code>HttpGetEndpoint</code> contains SOURCE pads for AUDIO and VIDEO, delivering media using HTML5 pseudo-streaming mechanism.
     *  This type of endpoint provide unidirectional communications. Its :rom:cls:`MediaSink` is associated with the HTTP GET method.
     */
    interface IHttpGetEndpoint extends IHttpEndpoint {
    }

    /**
     * An {@link module:elements.HttpPostEndpoint HttpPostEndpoint} contains SINK pads for AUDIO and VIDEO, which provide access to an HTTP file upload function
     * This type of endpoint provide unidirectional communications. Its :rom:cls:`MediaSources <MediaSource>` are accessed through the <a href="http://www.kurento.org/docs/current/glossary.html#term-http">HTTP</a> POST method.
     */
    interface IHttpPostEndpoint extends IHttpEndpoint {
    }

    /**
     * Implements an SDP negotiation endpoint able to generate and process offers/responses and that configures resources according to negotiated Session Description.
     */
    interface ISdpEndpoint extends ISessionEndpoint {

        /**
         * Maximum video bandwidth for receiving.
         *   Unit: kbps(kilobits per second).
         *    0: unlimited.
         *   Default value: 500
         */
        getMaxVideoRecvBandwidth(callback: ICallback<number>): Promise<number>;

        /**
         * Request a SessionSpec offer.
         * 
         *    This can be used to initiate a connection.
         */
        generateOffer(callback: ICallback<string>): Promise<string>;

        /**
         * This method gives access to the SessionSpec offered by this NetworkConnection.
         * 
         * <hr/><b>Note</b> This method returns the local MediaSpec, negotiated or not. If no offer has been generated yet, it returns null. It an offer has been generated it returns the offer and if an answer has been processed it returns the negotiated local SessionSpec.
         * Promise (callback) is resolved (called) with the last agreed SessionSpec
         */
        getLocalSessionDescriptor(callback: ICallback<string>): Promise<string>;

        /**
         * This method gives access to the remote session description.
         * 
         * <hr/><b>Note</b> This method returns the media previously agreed after a complete offer-answer exchange. If no media has been agreed yet, it returns null.
         * Promise (callback) is resolved (called) with the last agreed User Agent session description.
         */
        getRemoteSessionDescriptor(callback: ICallback<string>): Promise<string>;

        /**
         * Request the NetworkConnection to process the given SessionSpec answer (from the remote User Agent).
         *
         * @param {external:String} answer
         *  SessionSpec answer from the remote User Agent
         *
         * Promise (callback) is resolved (called) with updated SDP offer, based on the answer received.
         */
        processAnswer(answer: string, callback: ICallback<string>): Promise<string>;

        /**
         * Request the NetworkConnection to process the given SessionSpec offer (from the remote User Agent)
         *
         * @param {external:String} offer
         *  SessionSpec offer from the remote User Agent
         *
         * @param {module:core/abstracts.SdpEndpoint~processOfferCallback} [callback]
         *  Called with the chosen configuration from the ones stated in the SDP offer
         *
         * @return {external:Promise}
         *  Resolved with the chosen configuration from the ones stated in the SDP offer
         */
        processOffer(offer: string, callback?: ICallback<string>): Promise<string>;
    }

    /**
     * Base class to manage common RTP features.
     */
    interface IBaseRtpEndpoint extends ISdpEndpoint {

        /**
         * Maximum video bandwidth for sending.
         *   Unit: kbps(kilobits per second).
         *    0: unlimited.
         *   Default value: 500
         */
        getMaxVideoSendBandwidth(callback: ICallback<number>): Promise<number>;

        /**
         * Minimum video bandwidth for sending.
         *   Unit: kbps(kilobits per second).
         *    0: unlimited.
         *   Default value: 100
         */
        getMinVideoSendBandwidth(callback: ICallback<number>): Promise<number>;

    }

    /**
     * Endpoint that provides bidirectional content delivery capabilities with remote networked peers through RTP protocol. An {@link module:elements.RtpEndpoint RtpEndpoint} contains paired sink and source :rom:cls:`MediaPad` for audio and video.
     */
    interface IRtpEndpoint extends ISdpEndpoint {
    }

    /**
     * WebRtcEndpoint interface. This type of <code>Endpoint</code> offers media streaming using WebRTC.
     */
    interface IWebRtcEndpoint extends IBaseRtpEndpoint {
    }

    /** 
     * Interface for endpoints the require a URI to work. An example of this, would be a :rom:cls:`PlayerEndpoint` whose URI property could be used to locate a file to stream
     */
    interface IUriEndpoint extends IEndpoint {

        /**
         * The uri for this endpoint.
         */
        getUri(callback: ICallback<string>): Promise<string>;

        /**
         * Pauses the feed.
         */
        pause(callback?: ICallback<void>): Promise<void>;

        /**
         * Stops the feed.
         */
        stop(callback?: ICallback<void>): Promise<void>;
    }

    /**
     *  Retrieves content from seekable sources in reliable
     *  mode (does not discard media information) and inject 
     *  them into <a href="http://www.kurento.org/docs/current/glossary.html#term-kms">KMS</a>. It
     *  contains one :rom:cls:`MediaSource` for each media type detected.
     */
    interface IPlayerEndpoint extends IUriEndpoint {

        /**
         * Starts to send data to the endpoint :rom:cls:`MediaSource`
         */
        play(callback?: ICallback<void>): Promise<void>;
    }

    interface IRecorderEndpoint extends IUriEndpoint {
        
        /**
         * Starts storing media received through the :rom:cls:`MediaSink` pad
         */
        record(callback: ICallback<void>): Promise<void>;
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
        create(type: string, callback: ICallback<IMediaPipeline>): IKurentoClient;
        create(type: 'MediaPipeline', callback?: ICallback<IMediaPipeline>): IKurentoClient;

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
        connect(media: IMediaObject, callback: ICallback<void>): Promise<void>;

        /**
         * Get a reference to the current Kurento Media Server we are connected
         *
         * @callback {module:KurentoClientApi~getServerManagerCallback} callback
         *
         * @return {external:Promise}
         */
        getServerManager(callback: ICallback<IServerManager>): Promise<IServerManager>;
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
        new (ws_uri: string, options: IKurentoClientOptions, callback: ICallback<IKurentoClient>): IKurentoClient;
        /**
         * @param {String} ws_uri - Address of the Kurento Media Server
         */
        new (ws_uri: string, callback: ICallback<IKurentoClient>): IKurentoClient;
        checkType;
        MediaObjectCreator;
        register;
        TransactionsManager;
    }

}

declare var kurentoClient: Kurento.Client.IKurentoClientConstructor;

