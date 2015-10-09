var fs = require('fs');
var path = require('path');
var logger = require('./Logger');
var CrossbarConfig = (function () {
    function CrossbarConfig() {
    }
    CrossbarConfig.prototype.read = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var path = _this.getConfigFilePath();
            fs.readFile(path, 'utf8', function (err, content) {
                if (err)
                    return reject(err);
                resolve(_this.parseConfigFile(content));
            });
        });
    };
    CrossbarConfig.prototype.readSync = function () {
        var path = this.getConfigFilePath(), content = fs.readFileSync(path, 'utf8'), json = this.parseConfigFile(content);
        return json;
    };
    CrossbarConfig.prototype.getConfigFilePath = function () {
        var appRoot = path.dirname(require.main.filename), configPath = path.join(appRoot, '..', '.crossbar', 'config.json');
        if (!fs.existsSync(configPath)) {
            var err = 'CrossbarConfig.getConfigFilePath() failed to locate Crossbar.io configuration file. Searched location: ' + configPath;
            logger.error(err);
            throw new Error(err);
        }
        return configPath;
    };
    CrossbarConfig.prototype.parseConfigFile = function (content) {
        try {
            return JSON.parse(content);
        }
        catch (e) {
            logger.error('CrossbarConfig.parseConfigFile() failed to parse Crossbar.io configuration file.', e);
            throw e;
        }
    };
    return CrossbarConfig;
})();
module.exports = CrossbarConfig;
//# sourceMappingURL=CrossbarConfig.js.map