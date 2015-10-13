/*
 * (C) Copyright 2013 Kurento (http://kurento.org/)
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
/**
 * Object that piggy-back the browser console and show their messages on a DIV
 *
 * Inspired by Node.js ClIM module (https://github.com/epeli/node-clim)
 *
 * @constructor
 *
 * @param {String}
 *            id: id attribute of the DIV tag where to show the messages
 * @param console:
 *            reference to the original browser console
 */
var ConsoleWrapper = (function () {
    function ConsoleWrapper(id, console) {
        this._append = function (element) {
            this.div.appendChild(element);
            this.div.appendChild(document.createElement('BR'));
            // $(window).scrollTo('max', {duration: 500});
        };
        /**
         * Show an Error message both on browser console and on defined DIV
         *
         * @param msg:
         *            message or object to be shown
         */
        this.error = function (msg) {
            this.console.error(msg);
            this._append(this.createMessage(msg, "#FF0000"));
        };
        /**
         * Show an Warn message both on browser console and on defined DIV
         *
         * @param msg:
         *            message or object to be shown
         */
        this.warn = function (msg) {
            this.console.warn(msg);
            this._append(this.createMessage(msg, "#FFA500"));
        };
        /**
         * Show an Debug message both on browser console and on defined DIV
         *
         * @param msg:
         *            message or object to be shown
         */
        this.debug = function (msg) {
            this.console.log(msg);
            // this._append(createMessage(msg, "#0000FF"));
        };
        this.div = document.getElementById(id);
    }
    ConsoleWrapper.prototype.createMessage = function (msg, color) {
        // Sanitize the input
        msg = msg.toString().replace(/</g, '&lt;');
        var span = document.createElement('SPAN');
        if (color != undefined) {
            span.style.color = color;
        }
        span.appendChild(document.createTextNode(msg));
        return span;
    };
    /**
     * Show an Info message both on browser console and on defined DIV
     *
     * @param msg:
     *            message or object to be shown
     */
    ConsoleWrapper.prototype.info = function (msg) {
        this.console.info(msg);
        this._append(this.createMessage(msg));
    };
    ConsoleWrapper.prototype.log = function (msg) {
        this.info(msg);
    };
    ;
    return ConsoleWrapper;
})();
module.exports = ConsoleWrapper;
//# sourceMappingURL=Console.js.map