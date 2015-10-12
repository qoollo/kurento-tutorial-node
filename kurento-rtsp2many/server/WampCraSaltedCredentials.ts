
import autobahn = require('autobahn');
import WampCredentials = require('./WampCredentials');

/**
 * Represents credentials used to authenticate WAMP Node on WAMP Router 
 * WAMP Challenge-Response Authentication method (WAMP-CRA).
 */
class WampCraSaltedCredentials extends WampCredentials {

    constructor(authId: string, secret: string, salt: string, iterations: number, keylen: number) {
        super('wampcra', authId);
        this.secret = secret;
        this.salt = salt;
        this.iterations = iterations;
        this.keylen = keylen;
    }

    private secret: string;
    private salt: string;
    private iterations: number;
    private keylen: number;

    protected onChallengeConcrete(extra: any): autobahn.OnChallengeHandler {
        return <any>autobahn.auth_cra.derive_key(this.secret, this.salt, this.iterations, this.keylen);
    }
}

export = WampCraSaltedCredentials;