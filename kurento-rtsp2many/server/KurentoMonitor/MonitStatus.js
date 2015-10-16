var MonitSystemStatus = require('./MonitSystemStatus');
var MonitProcessStatus = require('./MonitProcessStatus');
var MonitStatus = (function () {
    function MonitStatus(monitSrc) {
        try {
            this.systemStatus = new MonitSystemStatus(monitSrc);
            this.processStatuses = monitSrc.service.filter(function (value, index, array) { return value.$.type == '3'; })
                .map(function (value, index, array) { return new MonitProcessStatus(value); });
        }
        catch (error) {
            console.log(error);
        }
    }
    return MonitStatus;
})();
module.exports = MonitStatus;

//# sourceMappingURL=MonitStatus.js.map
