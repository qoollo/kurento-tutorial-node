var path = require('path');
var fs = require('fs');
var winston = require('winston');
var appDir = path.dirname(require.main.filename), logsDir = path.join(appDir, '..', 'logs');
if (!fs.existsSync(logsDir))
    fs.mkdirSync(logsDir);
winston.add(winston.transports.DailyRotateFile, {
    dirname: logsDir,
    maxsize: 100 * 1024 * 1024,
    maxFiles: 1,
    filename: '20',
    datePattern: 'yy-MM-dd.log',
    prettyPrint: true,
    depth: 5,
    handleExceptions: true,
    humanReadableUnhandledException: true,
    level: 'debug'
});
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    timestamp: function () { return formatTimestamp(new Date()); },
    //formatter: options => {
    //    return options.timestamp() + ' ' + options.level.toUpperCase() + ' ' + (undefined !== options.message ? options.message : '') +
    //    (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '');
    //},
    colorize: true,
    level: 'debug'
});
function formatTimestamp(value) {
    return value.getFullYear() + '.' + padNumber(value.getMonth() + 1, 2) + '.' + padNumber(value.getDate(), 2)
        + ' ' +
        padNumber(value.getHours(), 2) + ':' + padNumber(value.getMinutes(), 2) + ':' + padNumber(value.getSeconds(), 2) + '.' + padNumber(value.getMilliseconds(), 4);
}
function padNumber(n, width, z) {
    if (z === void 0) { z = '0'; }
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
module.exports = winston;
//# sourceMappingURL=Logger.js.map