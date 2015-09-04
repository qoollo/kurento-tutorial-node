declare module Kurento {

    export interface ITransactional {
        beginTransaction(): ITransaction;
        endTransaction(callback);
        transaction(func, callback): ITransaction;
    }

    export interface INodeJsDomain {
        run(fn: Function): void;
        add(emitter: NodeJS.EventEmitter): void;
        remove(emitter: NodeJS.EventEmitter): void;
        bind(cb: (err: Error, data: any) => any): any;
        intercept(cb: (data: any) => any): any;
        dispose(): void;

        addListener(event: string, listener: Function): INodeJsDomain;
        on(event: string, listener: Function): INodeJsDomain;
        once(event: string, listener: Function): INodeJsDomain;
        removeListener(event: string, listener: Function): INodeJsDomain;
        removeAllListeners(event?: string): INodeJsDomain;
    }

    //  https://github.com/Kurento/kurento-client-js/blob/master/lib/TransactionsManager.js
    export interface ITransaction extends INodeJsDomain {
        length: number;
        push(...items: any[]): number;
        commited: boolean;
        commit(callback): ITransaction;
        rollback(callback): ITransaction;
    }

    //  https://github.com/Kurento/kurento-client-js/blob/master/lib/TransactionsManager.js
    export interface ITransactionsManager extends ITransactional {
        length: number;
        push(...items: ITransaction[]): number;
    }

    export interface IComplexType {
        toJSON(): Object;
    }

    /**
     * Pair key-value with info about a MediaObject
     */
    export interface ITag extends IComplexType {
        key: string;
        value: string;
    }

    export interface IMediaObject extends NodeJS.EventEmitter, Thenable<IMediaObject> {
        /**
         * Unique identifier of this object
         */
        id: number;

        /**
         * Childs of current object, all returned objects have parent set to current 
         * object
         */
        getChilds(callback: (error: Error, media: IMediaObject[]) => void): Promise<IMediaObject[]>

        /**
         * Number of seconds since Epoch when the element was created
         */
        getCreationTime(callback: (error: Error, result: number) => void): Promise<number>;

        /**
         * {@link module:core.MediaPipeline MediaPipeline} to which this MediaObject 
         * belong, or the pipeline itself if invoked over a {@link 
         * module:core.MediaPipeline MediaPipeline}
         */
        getMediaPipeline(callback: (error: Error, result: IMediaPipeline) => void): Promise<IMediaPipeline>;

        /**
         * Object name. This is just a comodity to simplify developers life debugging, 
         * it is not used internally for indexing nor idenfiying the objects. By default
         */
        getName(callback: (error: Error, result: string) => void): Promise<string>;

        /**
         * Object name. This is just a comodity to simplify developers life debugging, 
         * it is not used internally for indexing nor idenfiying the objects. By default
         */
        setName(name: string, callback: (error: Error) => void): Promise<void>;

        /**
         * parent of this media object. The type of the parent depends on the type of 
         * the element. The parent of a :rom:cls:`MediaPad` is its {@link 
         * module:core/abstracts.MediaElement MediaElement}; the parent of a {@link 
         * module:core/abstracts.Hub Hub} or a {@link module:core/abstracts.MediaElement
         */
        getParent(callback: (error: Error, result: IMediaObject) => void): Promise<IMediaObject>;

        /**
         * This property allows activate/deactivate sending the element tags in all its 
         * events.
         */
        getSendTagsInEvents(callback: (error: Error, result: boolean) => void): Promise<boolean>;

        /**
         * This property allows activate/deactivate sending the element tags in all its 
         * events.
         */
        setSendTagsInEvents(sendTagsInEvents: boolean, callback: (error: Error) => void): Promise<void>;

        /**
         * Request a SessionSpec offer.
         * This can be used to initiate a connection.
         */
        addTag(key: string, value: string, callback: (error: Error) => void): Promise<void>;

        /**
         * Returns the value associated to the given key.
         */
        getTag(key: string, callback: (error: Error, result: string) => void): Promise<string>;

        /**
         * Returns all the MediaObject tags.
         */
        getTags(callback: (error: Error, result: ITag[]) => void): Promise<ITag[]>;

        /**
         * Remove the tag (key and value) associated to a tag
         */
        removeTag(key: string, callback: (error: Error) => void): Promise<void>;

        /**
         * Explicity release a {@link module:core/abstract.MediaObject MediaObject} from memory
         */
        release(callback: (error: Error) => void): Promise<void>;

        catch(onRejected: (error: Error) => void): void;

        commited: boolean;
    }

    //  https://github.com/Kurento/kurento-client-core-js/blob/35840e1d592a8814188e2044d454ac333264b602/lib/MediaPipeline.js
    export interface IMediaPipeline extends IMediaObject, ITransactional {

        /**
          * Create a new instance of a {module:core/abstract.MediaObject} attached to
          * this {module:core.MediaPipeline}
          */
        create(type, params, callback: (error: Error, mediaObject: IMediaObject) => void): Promise<IMediaObject>;

        /**
         * If statistics about pipeline latency are enabled for all mediaElements
         */
        getLatencyStats(callback: (error: Error, result: boolean) => void): Promise<boolean>;

        /**
         * If statistics about pipeline latency are enabled for all mediaElements
         */
        getLatencyStats(latencyStats: boolean, callback: (error: Error) => void): Promise<boolean>;

        /**
         * Returns a string in dot (graphviz) format that represents the gstreamer 
         * elements inside the pipeline
         *
         * @param {(SHOW_MEDIA_TYPE|SHOW_CAPS_DETAILS|SHOW_NON_DEFAULT_PARAMS|SHOW_STATES|SHOW_ALL)} details
         */
        getGstreamerDot(details: string, callback: (error: Error, result: string) => void): Promise<string>;

        connect(media: IMediaObject, callback: (error: Error) => void): Promise<void>;
    }

    //  https://github.com/Kurento/kurento-client-js/blob/master/lib/MediaObjectCreator.js
    export interface IMediaObjectCreator {
        create(type, params, callback: (error: Error, mediaObject: IMediaObject) => void): Promise<IMediaObject>;
        createImmediate(item): Promise<IMediaObject>;
    }

    //  AUDIO|DATA|VIDEO
    export interface IMediaType extends String {
    }

    export interface IElementConnectionData extends IComplexType {
        /**
         * The source element in the connection
         */
        source: IMediaElement;
        /**
         * The sink element in the connection
         */
        sink: IMediaElement;
        /**
         * MediaType of the connection
         */
        type: IMediaType;
        
        /**
         * Description of source media. Could be emty.
         */
        sourceDescription: string;
        
        /**
         * Description of sink media. Could be emty.
         */
        sinkDescription: string;
    }

    //  https://github.com/Kurento/kurento-client-core-js/blob/master/lib/abstracts/MediaElement.js
    interface IMediaElement extends IMediaObject {
        /**
         * Maximum video bandwidth for transcoding.
         *   Unit: bps(bits per second).
         *   Default value: MAXINT
         */
        getMaxOuputBitrate(callback: (error: Error, result: number) => void): Promise<number>;

        /**
         * Maximum video bandwidth for transcoding.
         *   Unit: bps(bits per second).
         *   Default value: MAXINT
         */
        setMaxOuputBitrate(maxOuputBitrate: number, callback: (error: Error) => void): Promise<void>;

        /**
         * Minimum video bandwidth for transcoding.
         *   Unit: bps(bits per second).
         *   Default value: 0
         */
        getMinOuputBitrate(callback: (error: Error, result: number) => void): Promise<number>;

        /**
         * Minimum video bandwidth for transcoding.
         *   Unit: bps(bits per second).
         *   Default value: 0
         */
        setMinOuputBitrate(maxOuputBitrate: number, callback: (error: Error) => void): Promise<void>;

        /**
         * Connects two elements, with the given restrictions, current {@link 
         * module:core/abstracts.MediaElement MediaElement} will start emmit media to 
         * sink element. Connection could take place in the future, when both media 
         * element show capabilities for connecting with the given restrictions
         *
         * @param {IMediaElement} sink the target MediaElement that will
         * @param {(AUDIO|DATA|VIDEO)} mediaType the MediaType of the pads that will be connected
         * @param {String} sourceMediaDescription A textual description of the media source. Currently not used, aimed mainly 
         *                                        for {@link module:core/abstracts.MediaElement#MediaType.DATA} sources
         * @param {String} sinkMediaDescription A textual description of the media source. Currently not used, aimed mainly 
         *                                      for {@link module:core/abstracts.MediaElement#MediaType.DATA} sources
         */
        connect(sink: IMediaElement, mediaType: IMediaType, sourceMediaDescription: string, sinkMediaDescription: string, callback: (error: Error) => void): Promise<void>;

        /**
         * Disconnects two elements, with the given restrictions, current {@link 
         * module:core/abstracts.MediaElement MediaElement} stops sending media to sink 
         * element. If the previously requested connection didn't took place it is also 
         * removed
         *
         * @param {IMediaElement} sink the target MediaElement that will
         * @param {(AUDIO|DATA|VIDEO)} mediaType the MediaType of the pads that will be connected
         * @param {String} sourceMediaDescription A textual description of the media source. Currently not used, aimed mainly 
         *                                        for {@link module:core/abstracts.MediaElement#MediaType.DATA} sources
         * @param {String} sinkMediaDescription A textual description of the media source. Currently not used, aimed mainly 
         *                                      for {@link module:core/abstracts.MediaElement#MediaType.DATA} sources
         */
        disconnect(sink: IMediaElement, mediaType: IMediaType, sourceMediaDescription: string, sinkMediaDescription: string, callback: (error: Error) => void): Promise<void>;

        /**
         * Returns a string in dot (graphviz) format that represents the gstreamer 
         * elements inside the pipeline
         *
         * @param {(SHOW_MEDIA_TYPE|SHOW_CAPS_DETAILS|SHOW_NON_DEFAULT_PARAMS|SHOW_STATES|SHOW_ALL)} details
         */
        getGstreamerDot(details: string, callback: (error: Error, result: string) => void): Promise<string>;

        /**
         * Returns a list of the connections information of the elements that ere 
         * receiving media from this element.
         * @param {module:core/complexTypes.MediaType} [mediaType]
         *  One of {@link module:core/abstracts.MediaElement#MediaType.AUDIO}, {@link 
         *  module:core/abstracts.MediaElement#MediaType.VIDEO} or {@link 
         *  module:core/abstracts.MediaElement#MediaType.DATA}
         *
         * @param {external:String} [description]
         *  A textual description of the media source. Currently not used, aimed mainly 
         *  for {@link module:core/abstracts.MediaElement#MediaType.DATA} sources
         */
        getSinkConnections(mediaType: IMediaType, description: string, callback: (error: Error, result: IElementConnectionData) => void): Promise<IElementConnectionData>;

        /**
         * Get the connections information of the elements that are sending media to 
         * this element {@link module:core/abstracts.MediaElement MediaElement}
         * @param {module:core/complexTypes.MediaType} [mediaType]
         *  One of {@link module:core/abstracts.MediaElement#MediaType.AUDIO}, {@link 
         *  module:core/abstracts.MediaElement#MediaType.VIDEO} or {@link 
         *  module:core/abstracts.MediaElement#MediaType.DATA}
         *
         * @param {external:String} [description]
         *  A textual description of the media source. Currently not used, aimed mainly 
         *  for {@link module:core/abstracts.MediaElement#MediaType.DATA} sources
         */
        getSourceConnections(mediaType: IMediaType, description: string, callback: (error: Error, result: IElementConnectionData) => void): Promise<IElementConnectionData>;

        /**
         * Provides statistics collected for this endpoint.
         * Delivers a successful result in the form of a RTC stats report. A RTC stats 
         *  report represents a map between strings, identifying the inspected objects 
         *  (RTCStats.id), and their corresponding RTCStats objects.
         */
        getStats(mediaType: IMediaType, callback: (error: Error, result: Object) => void): Promise<Object>;

        /**
         * Sets the type of data for the audio stream. MediaElements that do not support
         */
        setAudioFormat(caps, callback);

        /**
         * @deprecated
         * Allows change the target bitrate for the media output, if the media is 
         * encoded using VP8 or H264. This method only works if it is called before the 
         * media starts to flow.
         */
        setOutputBitrateFormat(bitrate, callback);

        /**
         * Sets the type of data for the video stream. MediaElements that do not support
         */
        setVideoFormat(caps, callback);
    }

    export interface IKurentoClientConnectCallback {
        (error, client: IKurentoClient): void;
    }

    /** KMS|KCS */
    export interface IServerType extends String {
    }

    export interface IModuleInfo extends IComplexType {
        /**
         * Module version
         */
        version: string;

        /**
         * Module name
         */
        name: string;

        /**
         * Module available factories
         */
        factories: string;
    }

    /**
     * Description of the mediaserver
     */
    export interface IServerInfo extends IComplexType {
        /**
         * MediaServer version
         */
        version: string;
        
        /**
         * Descriptor of all modules loaded by the server
         */
        modules: IModuleInfo[];
        
        /**
         * Describes the type of mediaserver
         */
        type: IServerType;
        
        /**
         * Describes the capabilities that this server supports
         */
        capabilities: string[];
    }

    /**
     * This is a standalone object for managing the MediaServer
     */
    export interface IServerManager extends IMediaObject {
        /**
         * Server information, version, modules, factories, etc
         */
        getInfo(callback: (error: Error, result: IServerInfo) => void): Promise<IServerInfo>;

        /**
         * Metadata stored in the server
         */
        getMetadata(callback: (error: Error, result: string) => void): Promise<string>;

        /**
         * All the pipelines available in the server
         */
        getPipelines(callback: (error: Error, result: IMediaPipeline[]) => void): Promise<IMediaPipeline[]>;

        /**
         * All active sessions in the server
         */
        getSessions(callback: (error: Error, result: string) => void): Promise<string>;

        /**
         * Returns the kmd associated to a module
         *
         * @param {external:String} moduleName 
         *  Name of the module to get its kmd file
         */
        getKmd(moduleName, callback: (error: Error, result: string) => void): Promise<string>;
    }

    export interface IKurentoClient extends NodeJS.EventEmitter, ITransactional {
        connect(media: IMediaElement, callback: IKurentoClientConnectCallback): Promise<IKurentoClient>;

        /**
         * Get a reference to the current Kurento Media Server we are connected
         */
        getServerManager(callback: (error: Error, result: IServerManager) => void): Promise<IServerManager>;

        sessionId: number;

        getMediaobjectById(id: string, callback: (error: Error, result: IMediaElement) => void): Promise<IMediaElement>;
        getMediaobjectById(id: string[], callback: (error: Error, result: IMediaElement[]) => void): Promise<IMediaElement[]>;

        create(type, callback: (error: Error, mediaObject: IMediaObject) => void): Promise<IMediaObject>;
        create(type, params, callback: (error: Error, mediaObject: IMediaObject) => void): Promise<IMediaObject>;
    }
}

//  https://github.com/Kurento/kurento-utils-js/
declare module Kurento.Utils {

    /**
     * Wrapper object of an RTCPeerConnection. This object is aimed to simplify the
     * development of WebRTC-based applications.
     */
    export interface IWebRtcPeer extends NodeJS.EventEmitter {


        //=================================

        /**
         * @description This method creates the RTCPeerConnection object taking into
         *              account the properties received in the constructor. It starts
         *              the SDP negotiation process: generates the SDP offer and invokes
         *              the onsdpoffer callback. This callback is expected to send the
         *              SDP offer, in order to obtain an SDP answer from another peer.
         */
        start(server, options): void;

        /**
         * This method frees the resources used by WebRtcPeer.
         */
        dispose(): void;

        userMediaConstraints: {
            audio: boolean,
            video: {
                mandatory: {
                    maxWidth: number,
                    maxFrameRate: number,
                    minFrameRate: number
                }
            }
        };

        processSdpAnswer(sdpAnswer, successCallback);

        server: {
            iceServers: any
        }

        options: {
            optional: [{
                DtlsSrtpKeyAgreement: boolean
            }]
        };
    }

    export interface IWebRtcPeerCtor {
        new (): IWebRtcPeer;
        start(mode: string, localVideo: HTMLVideoElement, remoteVideo: HTMLVideoElement, onSdp, onError, mediaConstraints, server, options);
        startRecvOnly(remoteVideo: HTMLVideoElement, onSdp, onError, mediaConstraints, server, options);
        startSendOnly(localVideo: HTMLVideoElement, onSdp, onError, mediaConstraints, server, options);
        startSendRecv(localVideo: HTMLVideoElement, remoteVideo: HTMLVideoElement, onSdp, onError, mediaConstraints, server, options);
    }

    export interface IKurentoUtils {
        WebRtcPeer: IWebRtcPeerCtor;
    }

}