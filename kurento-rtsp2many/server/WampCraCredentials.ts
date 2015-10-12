
import autobahn = require('autobahn');
import WampCredentials = require('./WampCredentials');

/**
 * Represents credentials used to authenticate WAMP Node on WAMP Router 
 * WAMP Challenge-Response Authentication method (WAMP-CRA).
 */
class WampCraCredentials extends WampCredentials {

    constructor(authId: string, secret: string) {
        super('wampcra', authId);
        this.secret = secret;
    }

    private secret: string;

    protected onChallengeConcrete(extra: any): autobahn.OnChallengeHandler {
        return <any>autobahn.auth_cra.sign(this.secret, extra.challenge);
    }
}

export = WampCraCredentials;