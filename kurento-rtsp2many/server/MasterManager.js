/// <reference path="Master.ts" />
var IdCounterModule = require('./IdCounter');
var IdCounter = IdCounterModule.IdCounter;
var MasterManager = (function () {
    function MasterManager() {
        this._masters = [];
        this.idCounter = new IdCounter();
    }
    Object.defineProperty(MasterManager.prototype, "masters", {
        get: function () {
            return this._masters;
        },
        enumerable: true,
        configurable: true
    });
    MasterManager.prototype.addMaster = function (master) {
        master.id = this.idCounter.nextUniqueId.toString();
        this._masters.push(master);
        return master;
    };
    MasterManager.prototype.getMasterById = function (id) {
        return this._masters.filter(function (m) { return m.id === id.toString(); })[0];
    };
    MasterManager.prototype.getMasterByStreamUrl = function (streamUrl) {
        return this._masters.filter(function (m) { return m.streamUrl === streamUrl; })[0];
    };
    return MasterManager;
})();
exports.MasterManager = MasterManager;
//# sourceMappingURL=MasterManager.js.map