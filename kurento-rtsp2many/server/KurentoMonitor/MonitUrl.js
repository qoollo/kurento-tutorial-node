var url = require('url');
var MonitUrl = (function () {
    function MonitUrl(monitUrl) {
        if (monitUrl != null)
            this.monitUrl = url.parse(monitUrl);
    }
    MonitUrl.prototype.getUrl = function () {
        return url.format(this.monitUrl);
    };
    return MonitUrl;
})();
module.exports = MonitUrl;

//# sourceMappingURL=MonitUrl.js.map
