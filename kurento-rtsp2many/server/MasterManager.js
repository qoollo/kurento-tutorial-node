/// <reference path="IdCounter.ts" />
/// <reference path="Master.ts" />
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
        master.id = this.idCounter.nextUniqueId;
        this._masters.push(master);
        return master.id;
    };
    MasterManager.prototype.getMasterById = function (id) {
        return this._masters.filter(function (m) { return m.id === id; })[0];
    };
    return MasterManager;
})();
//# sourceMappingURL=MasterManager.js.map