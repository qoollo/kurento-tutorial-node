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
import readline = require('readline');

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

//  Static is served by Crossbar 
//app.use(express.static(path.join(__dirname, 'static')));

app.get('/', function (req, res) {
  res.send('Hello World!');
});
app.get('/api/streams', (req, res) => {
    kurentoHubServer
        .videoConnections
        .runningStreams
        .then(streams => res.send(JSON.stringify(streams)))
        .catch(err => res.status(500).send(err));
});
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
