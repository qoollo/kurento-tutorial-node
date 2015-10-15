var IdCounter = require('./IdCounter');
var ViewerManager = (function () {
    function ViewerManager() {
        this._viewers = [];
        this.idCounter = new IdCounter();
    }
    Object.defineProperty(ViewerManager.prototype, "viewers", {
        get: function () {
            return this._viewers;
        },
        enumerable: true,
        configurable: true
    });
    ViewerManager.prototype.addViewer = function (viewer) {
        viewer.sessionId = this.idCounter.nextUniqueId;
        this._viewers.push(viewer);
        return viewer;
    };
    ViewerManager.prototype.getViewerBySessionId = function (id) {
        return this._viewers.filter(function (m) { return m.sessionId === id; })[0];
    };
    ViewerManager.prototype.getViewerByStreamUrl = function (streamUrl) {
        return this._viewers.filter(function (m) { return m.streamUrl === streamUrl; })[0];
    };
    return ViewerManager;
})();
module.exports = ViewerManager;

//# sourceMappingURL=ViewerManager.js.map
