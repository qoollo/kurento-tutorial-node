var url = require('url');
var MonitUrl = (function () {
    function MonitUrl(monitUrl) {
        this._monitUrl = url.parse(monitUrl);
    }
    MonitUrl.prototype.getUrl = function () {
        return url.format(this._monitUrl);
    };
    Object.defineProperty(MonitUrl.prototype, "monitUrl", {
        get: function () {
            return this._monitUrl;
        },
        enumerable: true,
        configurable: true
    });
    return MonitUrl;
})();
exports.MonitUrl = MonitUrl;

//# sourceMappingURL=MonitUrl.js.map
