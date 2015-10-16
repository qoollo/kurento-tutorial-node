var http = require('http');
var xml2js = require('xml2js');
var MonitStatus = require('./MonitStatus');
var Logger = require('../Logger');
var MonitApiClient = (function () {
    function MonitApiClient() {
    }
    MonitApiClient.prototype.getMonitStatus = function (url) {
        return new Promise(function (resolve, reject) {
            try {
                var options = {
                    host: url.monitUrl.host,
                    path: url.monitUrl.path
                };
                var monitStatus;
                var getResponse = http.get(options, function (response) {
                    var xmlSrc = '';
                    response.on('data', function (chunk) {
                        xmlSrc += chunk;
                    });
                    response.on('error', function (error) {
                        reject(error);
                        Logger.error(error);
                    });
                    response.on('end', function () {
                        var src = xml2js.parseString(xmlSrc, function (error, result) {
                            if (error != null) {
                                reject(error);
                                Logger.error(error);
                            }
                            monitStatus = new MonitStatus(result.monit);
                            resolve(monitStatus);
                            Logger.debug('getMonitStatus resolved');
                        });
                    });
                });
                getResponse.on('error', function (error) {
                    reject(error);
                    Logger.error(error);
                });
            }
            catch (error) {
                reject(error);
                Logger.error(error);
            }
        });
    };
    return MonitApiClient;
})();
module.exports = MonitApiClient;

//# sourceMappingURL=MonitApiClient.js.map
