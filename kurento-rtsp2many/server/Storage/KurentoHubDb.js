var KurentoHubDb = (function () {
    function KurentoHubDb() {
        this.registeredVideoConsumers = [];
        //	Mongo me! Mongo me someone!
    }
    KurentoHubDb.prototype.getRegisteredVideoConsumers = function () {
        return Promise.resolve(this.registeredVideoConsumers);
    };
    KurentoHubDb.prototype.registerVideoConsumer = function () {
        var videoConsumer = {
            clientId: this.registeredVideoConsumers.reduce(function (p, c) { return Math.max(p, c.clientId); }, 1),
            registerTime: new Date()
        };
        this.registeredVideoConsumers.push(videoConsumer);
        return Promise.resolve(videoConsumer);
    };
    return KurentoHubDb;
})();
module.exports = KurentoHubDb;

//# sourceMappingURL=KurentoHubDb.js.map
