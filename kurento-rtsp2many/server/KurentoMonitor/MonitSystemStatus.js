var MonitSystemStatus = (function () {
    function MonitSystemStatus(monitSrc) {
        this.uptime = monitSrc.server.uptime;
        this.monitUrl = monitSrc.server.httpd.address + monitSrc.server.httpd.port;
        var service = monitSrc.service.filter(function (value, index, array) { return value.$.type == '5'; })[0];
        this.memoryPercent = service.memory.percent;
        this.cpuLoad = service.cpu.user + service.cpu.system;
    }
    return MonitSystemStatus;
})();
module.exports = MonitSystemStatus;

//# sourceMappingURL=MonitSystemStatus.js.map
