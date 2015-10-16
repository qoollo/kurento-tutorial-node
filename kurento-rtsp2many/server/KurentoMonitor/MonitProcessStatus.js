var MonitProcessStatus = (function () {
    function MonitProcessStatus(serviceSrc) {
        this.uptime = serviceSrc.uptime;
        this.memoryPercent = serviceSrc.memory.percent;
        this.cpuPercent = serviceSrc.cpu.percent;
        this.uptime = serviceSrc;
    }
    return MonitProcessStatus;
})();
module.exports = MonitProcessStatus;

//# sourceMappingURL=MonitProcessStatus.js.map
