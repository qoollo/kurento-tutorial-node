var http = require('http');
var xml2js = require('xml2js');
var MonitStatus = require('./MonitStatus');
var MonitApiClient = (function () {
    function MonitApiClient() {
    }
    MonitApiClient.prototype.getMonitStatus = function (url) {
        var options = {
            host: url.monitUrl.host,
            path: url.monitUrl.path
        };
        var monitStatus;
        http.get(options, function (response) {
            var xmlSrc = '';
            response.on('data', function (chunk) {
                xmlSrc += chunk;
            });
            response.on('error', function (error) {
                return console.log(error);
            });
            response.on('end', function () {
                var src = xml2js.parseString(xmlSrc, function (err, result) {
                    if (err != null)
                        return console.log(err);
                    monitStatus = new MonitStatus(result.monit);
                });
            });
        });
        return null;
    };
    return MonitApiClient;
})();
module.exports = MonitApiClient;

//# sourceMappingURL=MonitApiClient.js.map
