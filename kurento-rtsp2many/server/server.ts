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

