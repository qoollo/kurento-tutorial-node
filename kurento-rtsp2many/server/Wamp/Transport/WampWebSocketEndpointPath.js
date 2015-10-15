var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var WampEndpointPath = require('./WampEndpointPath');
var WampWebSocketEndpointPath = (function (_super) {
    __extends(WampWebSocketEndpointPath, _super);
    function WampWebSocketEndpointPath(path) {
        _super.call(this, 'websocket', path);
    }
    return WampWebSocketEndpointPath;
})(WampEndpointPath);
module.exports = WampWebSocketEndpointPath;

//# sourceMappingURL=WampWebSocketEndpointPath.js.map
