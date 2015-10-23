/* 
 * (C) Copyright 2014 Kurento (http://kurento.org/)
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Lesser General Public License
 * (LGPL) version 2.1 which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/lgpl-2.1.html
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 */

checkPromisesSupport();

import express = require('express');
import bodyParser = require('body-parser');
import readline = require('readline');
import path = require('path');

import cfg = require('./AppConfig');
import logger = require('./Logger');
import KurentoHubServer = require('./KurentoHubServer');
import KurentoHubDb = require('./Storage/KurentoHubDb');


logger.info('KurentoHub initializing....');

var app = express(),
    db = new KurentoHubDb(),
    kurentoHubServer = new KurentoHubServer(db);
db.seedData()
    .then(() => kurentoHubServer.start())
    .then(() => logger.info('KurentoHub started.'));

handleCtrlC();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'web')));

var testMode = false, 
    testConnections = [
    {
        streamUrl: "rtsp://10.5.5.85/media/video2",
        kurentoServerUrl: "ws://10.5.6.119:8888/kurento",
        clients: [
            {
                clientId: 1,
                registerTime: "2015-10-22T07:00:33.665Z",
                streamConnections: []
            }]
    }];

app.get('/api/streams', (req, res) => {
    logger.debug('GET /api/streams');
    if (testMode) {
        res.send(testConnections);
        return;
    }
    kurentoHubServer
        .videoConnections
        .runningStreams
        .then(streams => res.send(streams))
        .catch(err => res.status(500).send(err));
});
app.delete('/api/streams', (req, res) => {
    logger.debug('DELETE /api/delete');
    if (testMode) {
        var match = testConnections.filter(c => c.streamUrl == req.body.streamUrl)[0];
        if (match) { 
            testConnections.splice(testConnections.indexOf(match));
            res.send(200);
        } else
            res.status(404).send('Such stream was not found among running streams.');
        return;
    }
    kurentoHubServer
        .videoConnections
        .killStream(req.body.streamUrl)
        .then(() => res.send(200), err => res.status(500).send(err))
});
/*
app.all('*', (req, res, next) => {
    logger.debug('Access-Control-Allow-Origin');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});*/
var server = app.listen(8082, 'localhost', () => {
    var host = server.address().address;
    var port = server.address().port;

    console.log('API listening at http://%s:%s', host, port);
});







/**
 * Handles Ctrl+c to gracefully terminate
 */
function handleCtrlC(): void {
    //  Windows handler for Ctrl + C
    if (process.platform == 'win32') {
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.on('SIGINT', () => process.emit('SIGINT'));
    }

    //  Handler for Ctrl + C
    process.on('SIGINT', () => {
        logger.info("Caught interrupt signal. Stopping KurentoHubServer...");

        kurentoHubServer.stop()
            .then(() => {
                logger.info('KurentoHubServer stopped. Goodbye!');
                process.exit();
            }, () => {
                logger.error('Failed to stop KurentoHubServer.');
                process.exit(1);
            });
    });
}

/**
 * Throws and loggs an error if Promise is not available in current runtime.
 */
function checkPromisesSupport() {
    if (typeof Promise === 'undefined') {
        var err = new Error('Promises are not supported by current V8 engine. Update Node.js.');
        logger.error(err.message);
        throw err;
    }
}
