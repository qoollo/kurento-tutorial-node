
import path = require('path');
import fs = require('fs');
import winston = require('winston');

var appDir = path.dirname(require.main.filename),
    logsDir = path.join(appDir, '..', 'logs');

if (!fs.existsSync(logsDir))
    fs.mkdirSync(logsDir);

winston.add(winston.transports.DailyRotateFile, <winston.DailyRotateFileTransportOptions>{
    dirname: logsDir,
    maxsize: 100 * 1024 * 1024,  //  100 MB
    maxFiles: 1,
    filename: '20',
    datePattern: 'yy-MM-dd.log',
    prettyPrint: true,
    depth: 5,
    handleExceptions: true,
    humanReadableUnhandledException: true,
});

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, <winston.ConsoleTransportOptions>{
    timestamp: () => formatTimestamp(new Date()),
    //formatter: options => {
    //    return options.timestamp() + ' ' + options.level.toUpperCase() + ' ' + (undefined !== options.message ? options.message : '') +
    //    (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '');
    //},
    colorize: true
});

function formatTimestamp(value: Date): string {
    return value.getFullYear() + '.' + padNumber(value.getMonth() + 1, 2) + '.' + padNumber(value.getDate(), 2) + ' ' + value.getHours() + ':' + value.getMinutes() + ':' + value.getSeconds() + '.' + padNumber(value.getMilliseconds(), 4);
}

function padNumber(n, width, z = '0'): string {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

export = winston;