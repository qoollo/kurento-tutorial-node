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
var WampCraSaltedCredentials = (function (_super) {
    __extends(WampCraSaltedCredentials, _super);
    function WampCraSaltedCredentials(authId, secret, salt, iterations, keylen) {
        _super.call(this, 'wampcra', authId);
        this.secret = secret;
        this.salt = salt;
        this.iterations = iterations;
        this.keylen = keylen;
    }
    WampCraSaltedCredentials.prototype.onChallengeConcrete = function (extra) {
        var key = autobahn.auth_cra.derive_key(this.secret, this.salt, this.iterations, this.keylen);
        return autobahn.auth_cra.sign(key, extra.challenge);
    };
    return WampCraSaltedCredentials;
})(WampCredentials);
module.exports = WampCraSaltedCredentials;

//# sourceMappingURL=WampCraSaltedCredentials.js.map
