var KurentoPlayer /*extends EventTarget*/ = (function () {
    function KurentoPlayer /*extends EventTarget*/(streamUrl) {
        //super();
        this._streamUrl = streamUrl;
    }
    Object.defineProperty(KurentoPlayer /*extends EventTarget*/.prototype, "streamUrl", {
        get: function () {
            return this._streamUrl;
        },
        enumerable: true,
        configurable: true
    });
    KurentoPlayer /*extends EventTarget*/.prototype.play = function () {
        return Promise.reject('Not implemented');
    };
    KurentoPlayer /*extends EventTarget*/.prototype.stop = function () {
        return Promise.reject('Not implemented');
    };
    return KurentoPlayer /*extends EventTarget*/;
})();
module.exports = KurentoPlayer;

//# sourceMappingURL=KurentoPlayer.js.map
