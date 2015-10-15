/**
 *  Base class for WAMP credentials used to authenticate
 *  WAMP node on WAMP Router.
 *  http://crossbar.io/docs/Authentication/
 */
var WampCredentials = (function () {
    function WampCredentials(authMethod, authId) {
        this.authMethod = authMethod;
        this.authId = authId;
    }
    WampCredentials.prototype.setupAuth = function (wampConnectionConfig) {
        var _this = this;
        wampConnectionConfig.authmethods = [this.authMethod];
        wampConnectionConfig.authid = this.authId;
        wampConnectionConfig.onchallenge = function (session, method, extra) { return _this.onChallenge(session, method, extra); };
        return wampConnectionConfig;
    };
    WampCredentials.prototype.onChallenge = function (session, method, extra) {
        try {
            if (method === this.authMethod) {
                return this.onChallengeConcrete(extra);
            }
        }
        catch (e) {
            throw new Error('Failed to process WAMP Auth challenge. ' + e.message);
        }
    };
    return WampCredentials;
})();
module.exports = WampCredentials;

//# sourceMappingURL=WampCredentials.js.map
