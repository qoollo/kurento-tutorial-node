var KurentoStatus = require('./KurentoStatus');
var KurentoHubDb = require('../Storage/KurentoHubDb');
var MonitApiClient = require('./MonitApiCLient');
var Monit = require('./Monit');
var KurentoHeartbeatMonitor = (function () {
    function KurentoHeartbeatMonitor(timer, timeout) {
        this.timer = timer;
        this.timeout = timeout;
        this.monitApi = new MonitApiClient();
        this.db = new KurentoHubDb();
    }
    KurentoHeartbeatMonitor.prototype.start = function (url) {
        this.startedMonits.push(new Monit(url));
    };
    KurentoHeartbeatMonitor.prototype.stop = function (url) {
    };
    KurentoHeartbeatMonitor.prototype.raiseEvent = function (event, status) {
        if (event)
            event(status);
    };
    KurentoHeartbeatMonitor.prototype.timerCallback = function () {
        for (var i = 0; i < this.startedMonits.length; i++) {
            this.monitApi.getMonitStatus(this.startedMonits[i].url).then(this.successStatus, this.errorStatus);
        }
    };
    KurentoHeartbeatMonitor.prototype.successStatus = function (monitStatus) {
        var kurentoStatus = new KurentoStatus(monitStatus);
        var oldKurentoStatus = this.getKurentoStatusFromDB();
        this.raiseEvent(this.onstatus, kurentoStatus);
    };
    KurentoHeartbeatMonitor.prototype.getKurentoStatusFromDB = function () {
        return null;
    };
    KurentoHeartbeatMonitor.prototype.getKurentoStatusFromMonit = function () {
        return null;
    };
    KurentoHeartbeatMonitor.prototype.errorStatus = function (error) {
    };
    return KurentoHeartbeatMonitor;
})();
module.exports = KurentoHeartbeatMonitor;

//# sourceMappingURL=KurentoHeartbeatMonitor.js.map
