var IdCounter = (function () {
    function IdCounter(startId) {
        if (startId === void 0) { startId = 0; }
        this._lastId = startId - 1;
    }
    Object.defineProperty(IdCounter.prototype, "nextUniqueId", {
        get: function () {
            this._lastId++;
            return this._lastId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(IdCounter.prototype, "lastId", {
        get: function () {
            return this._lastId;
        },
        enumerable: true,
        configurable: true
    });
    return IdCounter;
})();
//# sourceMappingURL=IdCounter.js.map