var WampListeningEndpoint = (function () {
    function WampListeningEndpoint(port) {
        this.version = '4';
        /**
         * optional accept queue depth of listening endpoints (default: 50)
         */
        this.backlog = 50;
        /**
         * flag which controls sharing the socket between multiple workers - this currently only works on Linux >= 3.9 (default: false)
         */
        this.shared = false;
        this._port = port;
    }
    Object.defineProperty(WampListeningEndpoint.prototype, "type", {
        get: function () {
            return 'tcp';
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WampListeningEndpoint.prototype, "port", {
        get: function () {
            return this._port;
        },
        enumerable: true,
        configurable: true
    });
    return WampListeningEndpoint;
})();
module.exports = WampListeningEndpoint;

//# sourceMappingURL=WampListeningEndpoint.js.map
