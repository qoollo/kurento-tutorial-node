var Viewer = (function () {
    function Viewer(sessionId, streamUrl, sdpOffer) {
        this._sessionId = sessionId;
        this._streamUrl = streamUrl;
        this._sdpOffer = sdpOffer;
    }
    Object.defineProperty(Viewer.prototype, "sessionId", {
        get: function () {
            return this._sessionId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Viewer.prototype, "streamUrl", {
        get: function () {
            return this._streamUrl;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Viewer.prototype, "sdpOffer", {
        get: function () {
            return this._sdpOffer;
        },
        enumerable: true,
        configurable: true
    });
    return Viewer;
})();

//# sourceMappingURL=Viewer.js.map
