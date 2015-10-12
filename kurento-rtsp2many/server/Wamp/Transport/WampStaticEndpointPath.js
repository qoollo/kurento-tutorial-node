var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var WampEndpointPath = require('./WampEndpointPath');
var WampStaticEndpointPath = (function (_super) {
    __extends(WampStaticEndpointPath, _super);
    function WampStaticEndpointPath(path, directory) {
        _super.call(this, 'static', path);
        this.directory = directory;
    }
    return WampStaticEndpointPath;
})(WampEndpointPath);
module.exports = WampStaticEndpointPath;

//# sourceMappingURL=WampStaticEndpointPath.js.map
