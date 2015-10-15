var WampEndpointPath = (function () {
    function WampEndpointPath(type, path) {
        this._type = type;
        this._path = path;
    }
    Object.defineProperty(WampEndpointPath.prototype, "type", {
        get: function () {
            return this._type;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WampEndpointPath.prototype, "path", {
        get: function () {
            return this._path;
        },
        enumerable: true,
        configurable: true
    });
    return WampEndpointPath;
})();
module.exports = WampEndpointPath;

//# sourceMappingURL=WampEndpointPath.js.map
