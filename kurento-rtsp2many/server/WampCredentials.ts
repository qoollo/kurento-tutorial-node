
import logger = require('./Logger');

/**
 *  Base class for WAMP credentials used to authenticate 
 *  WAMP node on WAMP Router.
 *  http://crossbar.io/docs/Authentication/
 */
abstract class WampCredentials {

    constructor(authMethod: string, authId: string) {
        this.authMethod = authMethod;
        this.authId = authId;
    }

    protected authMethod: string;

    protected authId: string;

    public setupAuth(wampConnectionConfig: autobahn.IConnectionOptions): autobahn.IConnectionOptions {
        wampConnectionConfig.authmethods = [this.authMethod];
        wampConnectionConfig.authid = this.authId;
        wampConnectionConfig.onchallenge = (session, method, extra) => this.onChallenge(session, method, extra);
        return wampConnectionConfig;
    }

    private onChallenge(session: autobahn.Session, method: string, extra: any): autobahn.OnChallengeHandler {
        try {
            if (method === this.authMethod) {
                return this.onChallengeConcrete(extra);
            }
        } catch (e) {
            logger.error('Failed to process WAMP Auth challenge.', e.message);
            throw e;
        }
    }

    protected abstract onChallengeConcrete(extra: any): autobahn.OnChallengeHandler;
}

export = WampCredentials;