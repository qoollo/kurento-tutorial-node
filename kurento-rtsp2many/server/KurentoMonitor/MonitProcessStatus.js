var MonitProcessStatus = (function () {
    function MonitProcessStatus(serviceSrc) {
        try {
            this.uptime = serviceSrc.uptime;
            this.memoryPercent = serviceSrc.memory.percent;
            this.cpuPercent = serviceSrc.cpu.percent;
        }
        catch (error) {
            console.log(error);
        }
        this.uptime = serviceSrc;
    }
    return MonitProcessStatus;
})();
module.exports = MonitProcessStatus;

//# sourceMappingURL=MonitProcessStatus.js.map
