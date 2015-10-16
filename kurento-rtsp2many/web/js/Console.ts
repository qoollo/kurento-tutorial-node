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
class ConsoleWrapper {

    constructor(id, console) {
        this.div = document.getElementById(id);
        this.console = console;
    }

    private div: HTMLElement;
    private console: Console;

    private stringFormat(str: string, ...args?: any[]): string {
        var i = str.indexOf('%');
        while (i >= 0) {
            if (str.substr(i, 2) == '%d')
                str = str.substring(0, i) + Number(args.shift()) + str.substring(i + 2);
            i = str.indexOf('%');
        }
        return str;
    }

    private createMessage(msg: string, color?: string) {
        // Sanitize the input
        msg = msg.toString().replace(/</g, '&lt;');
        var span = document.createElement('SPAN');
        if (color != undefined) {
            span.style.color = color;
        }
        span.appendChild(document.createTextNode(msg));
        return span;
    }

    private _append = function (element) {
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
    public error = function (msg) {
        this.console.error(msg);
        this._append(this.createMessage(msg, "#FF0000"));
    };

	/**
	 * Show an Warn message both on browser console and on defined DIV
	 * 
	 * @param msg:
	 *            message or object to be shown
	 */
    public warn = function (msg) {
        this.console.warn(msg);
        this._append(this.createMessage(msg, "#FFA500"));
    };

	/**
	 * Show an Info message both on browser console and on defined DIV
	 * 
	 * @param msg:
	 *            message or object to be shown
	 */
    public info(msg) {
        this.console.info(msg);
        this._append(this.createMessage(msg));
    }

    public log(msg) {
        this.info(msg);
    };

	/**
	 * Show an Debug message both on browser console and on defined DIV
	 * 
	 * @param msg:
	 *            message or object to be shown
	 */
    public debug (msg) {
        this.console.log(msg);
        // this._append(createMessage(msg, "#0000FF"));
    };

    public info(...args?: any[]) {
        this.console.info.apply(this.console, args)
        this._append(this.createMessage(this.stringFormat(args[0], args.slice(1)), "#0000FF"));
    };
}

export = ConsoleWrapper;