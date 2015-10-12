var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var autobahn = require('autobahn');
var WampCredentials = require('./WampCredentials');
/**
 * Represents credentials used to authenticate WAMP Node on WAMP Router
 * WAMP Challenge-Response Authentication method (WAMP-CRA).
 */
var WampCraCredentials = (function (_super) {
    __extends(WampCraCredentials, _super);
    function WampCraCredentials(authId, secret) {
        _super.call(this, 'wampcra', authId);
        this.secret = secret;
    }
    WampCraCredentials.prototype.onChallengeConcrete = function (extra) {
        return autobahn.auth_cra.sign(this.secret, extra.challenge);
    };
    return WampCraCredentials;
})(WampCredentials);
module.exports = WampCraCredentials;
//# sourceMappingURL=WampCraCredentials.js.map