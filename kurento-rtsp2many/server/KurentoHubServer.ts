﻿/// <reference path="Protocol/Protocol.d.ts" />

import logger = require('./Logger');
import AppConfig = require('./AppConfig');
import autobahn = require('autobahn');
import KurentoHubRpcNames = require('./KurentoHubRpcNames');
import ConnectionState = require('./ConnectionState');
import CrossbarConfig = require('./CrossbarConfig');
import WampWebTransportConfiguration = require('./Wamp/Transport/WampWebTransportConfiguration');
import WampRouterConnectionManager = require('./WampRouterConnectionManager');
import WampCredentials = require('./WampCredentials');
import WampCraCredentials = require('./WampCraCredentials');


import VideoConnectionsManager = require('./VideoConnectionsManager');
import MasterManager = require('./MasterManager');
import Master = require('./Master');
import ViewerManager = require('./ViewerManager');
import IdCounter = require('./IdCounter');
var KurentoClient: Kurento.Client.IKurentoClientConstructor = require('kurento-client');
import KurentoClientManager = require('./KurentoClientManager');


class KurentoHubServer {

    private connectionManager: WampRouterConnectionManager;
    private videoManager: VideoConnectionsManager;
    private db;

    constructor(db) {
        this.db = db;
        this.videoManager = new VideoConnectionsManager(db, <any>logger);
    }

    start(): Promise<any> {
        return new CrossbarConfig()
            .getKurentoHubUrl()
            .then(url => this.connectionManager = new WampRouterConnectionManager(url, 'AquaMedKurentoInteraction', new WampCraCredentials('KurentoHub', 'secret2'), logger))
            .then(m => m.start())
            .then(s => {
                return Promise.all<any>([
                    this.registerRpcs(s),
                    this.subscribeEvents(s)
                ]);
            })
            .then(() => this.onServerStarted());
    }

    stop(): Promise<void> {
        return this.connectionManager.stop();
    }
    
    private onServerStarted(): void {
        logger.info('KurentoHub started.', { 'class': 'KurentoHubServer', 'method': 'onServerStarted' });
        this.getStreamsToRun()
            .then(streams => this.videoConnections.syncStreams(streams));
    }

    public get state(): ConnectionState {
        return this.connectionManager.state;
    }
    
    public get videoConnections(): VideoConnectionsManager {
        return this.videoManager;
    }

    private registerRpcs(session: autobahn.Session): Promise<autobahn.IRegistration[]> {
        var res = Promise.all([
            session.register(KurentoHubRpcNames.getVersion, (args, kwargs) => this.getVersion()),
            session.register(KurentoHubRpcNames.register, (args, kwargs) => this.register()),
            session.register(KurentoHubRpcNames.connectToStream, (args, kwargs) => this.connectToStream(args[0], args[1], args[2]))
        ]);
        res.then(registrations =>
            registrations.forEach(r => logger.debug('KurentoHubServer RPC registered: ' + r.procedure)));
        res.catch(err => {
            logger.error('KurentoHubServer Failed to register RPCs.', err);
            Promise.reject(err);
        });
        return res;
    }
    private subscribeEvents(session: autobahn.Session): Promise<autobahn.ISubscription[]> {
        var res = Promise.all([
            session.subscribe('com.kurentoHub.onstreamstorunchanged', (args) => this.onStreamsToRunChanged(args[0]))
        ]);
        res.then(subscriptions =>
            subscriptions.forEach(s => logger.debug('KurentoHubServer subscribed for Event: ' + s.topic)));
        res.catch(err => {
            logger.error('KurentoHubServer failed to subscribe for Events.', err);
            Promise.reject(err);
        });
        return res;
    }
    
    /**
     * StreamsToRunChanged event listener. StreamsToRunChanged event is produced by SystemController
     * when something changes: stream is created or removed.
     */
    private onStreamsToRunChanged(streamsToRun: Protocol.IStreamsToRunChangedEventArgs): void {
        logger.debug('Remote Event published: StreamsToRunChanged');
        this.videoConnections.syncStreams(streamsToRun.StreamsToRun);
            //.then(() => logger.info('Streams sync complete.', { 'class': 'KurentoHubServer', 'method': 'onStreamsToRunChanged' }))
            //.catch(err => logger.error('Streams sync failed.', { 'class': 'KurentoHubServer', 'method': 'onStreamsToRunChanged', 'error': err }))
    }
    
    public getStreamsToRun(): Promise<Protocol.IVideoStream[]> {
        logger.info('RPC call: getStreamsToRun', { 'class': 'KurentoHubServer', 'method': 'getStreamsToRun' })
        var res = this.connectionManager.session.call(KurentoHubRpcNames.getStreamsToRun);
        res.catch(err => {
            if (this.connectionManager.isNoSuchProcedureError(err))
                logger.info('RPC getStreamsToRun call failed: no such RPC registered. SystemController is offline.');
            else
                logger.error('RPC getStreamsToRun call error. ' + err, { 'class': 'KurentoHubServer', 'method': 'getStreamsToRun', 'error': err });
        });
        return res;
    }

    /**
     * Returns KurentoHub version. This is RPC getVersion implementation.
     */
    private getVersion(): Promise<Protocol.IKurentoHubVersion> {
        logger.debug('RPC called: getVersion');
        return Promise.resolve(AppConfig.config.get().version);
    }

    /**
     * Registers client and returns ClientId. ClientId can be later used by VideoConsumer
     * to connect to stream (RPC connectToStream). This is RPC register implementation.
     */
    private register(): Promise<Protocol.IClientId> {
        logger.debug('RPC called: register');
        return this.db.registerVideoConsumer()
            .then(r => {
                logger.debug('RPC register succeeded. Result: ' + r.clientId);
                return r;
            }, err => {
                logger.error('RPC register failed.' + err)
                return Promise.reject(err);
            })
    }

    /**
     * Connects VideoConsumer to stream. This is RPC connectToStream implementation. 
     */
    private connectToStream(client: Protocol.IClientId, streamUrl: string, sdpOffer: string): Promise<Protocol.IConnectToStreamResponse> {
        logger.debug('RPC called: connectToStream');
        return this.db.getRegisteredVideoConsumers()
            .then(clients => clients.filter(c => c.clientId == client.clientId)[0])
            .then(consumer =>
                this.videoManager.connectClientToStream(consumer, sdpOffer, streamUrl)
                    .then(connection => {
                        return {
                            clientId: client,
                            streamUrl: streamUrl,
                            sdpAnswer: connection.sdpAnswer
                        }
                    }));
        //return this.addMasterIfNotExists(streamUrl)
        //    .then(m => this.processAddViewer(1, m, streamUrl, sdpOffer));
    }

    private masterManager: MasterManager = new MasterManager();
    private viewerManager: ViewerManager = new ViewerManager();
    private kurentoClientManager = new KurentoClientManager(KurentoClient);

    private addMasterIfNotExists(streamUrl: string): Promise<Master> {
        var master = this.masterManager.getMasterByStreamUrl(streamUrl);
        if (!master)
            master = this.masterManager.addMaster(new Master(null, streamUrl, null, this.kurentoClientManager));
        return Promise.resolve(master);
    }

    private processAddViewer(sessionId: number, master: Master, streamUrl: string, sdpOffer: string): Promise<Protocol.IConnectToStreamResponse> {
        var viewer = this.viewerManager.getViewerBySessionId(sessionId);
        if (!viewer)
            viewer = this.viewerManager.addViewer(new Viewer(sessionId, streamUrl, sdpOffer));

        return new Promise((resolve, reject) => {
            master.addViewer(viewer, (err, sdpAnswer) => {
                if (err)
                    reject(logger.error('Failed to add Viewer to Master.', sdpAnswer));

                logger.info('Added Viewer to Master. SdpAnswer:', sdpAnswer);
                resolve({
                    streamUrl: streamUrl,
                    sdpAnswer: sdpAnswer
                });
            });
        });

    }
}

export = KurentoHubServer