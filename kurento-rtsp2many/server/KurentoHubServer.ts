﻿/// <reference path="Protocol/RpcResponses.d.ts" />

import logger = require('./Logger');
import autobahn = require('autobahn');
import KurentoHubRpcNames = require('./KurentoHubRpcNames');
import ConnectionState = require('./ConnectionState');
import CrossbarConfig = require('./CrossbarConfig');
import WampWebTransportConfiguration = require('./Wamp/Transport/WampWebTransportConfiguration');
import WampRouterConnectionManager = require('./WampRouterConnectionManager');
import WampCredentials = require('./WampCredentials');
import WampCraCredentials = require('./WampCraCredentials');
import KurentoHubDb = require('./Storage/KurentoHubDb');


import MasterManager = require('./MasterManager');
import Master = require('./Master');
import ViewerManager = require('./ViewerManager');
import IdCounter = require('./IdCounter');
var KurentoClient: Kurento.Client.IKurentoClientConstructor = require('kurento-client');
import KurentoClientManager = require('./KurentoClientManager');


class KurentoHubServer {

    private connectionManager: WampRouterConnectionManager;
    private db: KurentoHubDb;

    constructor() {
        this.db = new KurentoHubDb();
    }

    start(): Promise<void> {
        return new CrossbarConfig()
            .getKurentoHubUrl()
            .then(url => this.connectionManager = new WampRouterConnectionManager(url, 'AquaMedKurentoInteraction', new WampCraCredentials('KurentoHub', 'secret2'), logger))
            .then(m => m.start())
            .then(s => this.registerRpcs(s))
            .then(registrations => {
                debugger;
            });
    }

    stop(): Promise<void> {
        return this.connectionManager.stop();
    }

    public get state(): ConnectionState {
        return this.connectionManager.state;
    }

    private registerRpcs(session: autobahn.Session): Promise<autobahn.IRegistration[]> {
        var res = Promise.all([
            session.register(KurentoHubRpcNames.register, (args, kwargs) => this.register()),
            session.register(KurentoHubRpcNames.connectToStream, (args, kwargs) => this.connectToStream(args[0], args[1]))
        ]);
        res.then(registrations =>
            registrations.forEach(r => logger.debug('KurentoHubServer RPC registered: ' + r.procedure)));
        res.catch(err => {
            logger.error('KurentoHubServer Failed to register RPCs.', err);
            Promise.reject(err);
        });
        return res;
    }

    register(): Promise<Protocol.IClientId> {
        return this.db.registerVideoConsumer();
    }

    connectToStream(streamUrl: string, sdpOffer: string): Promise<Protocol.IConnectToStreamResponse> {
        return this.addMasterIfNotExists(streamUrl)
            .then(m => this.processAddViewer(1, m, streamUrl, sdpOffer));
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