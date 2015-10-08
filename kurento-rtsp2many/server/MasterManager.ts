
import IdCounter = require('./IdCounter');

import Master = require('./Master');

class MasterManager {

    get masters(): Master[]{
        return this._masters;
    }
    private _masters: Master[] = [];

    private idCounter = new IdCounter();

    addMaster(master: Master): Master {
        master.id = this.idCounter.nextUniqueId.toString();
        this._masters.push(master);

        return master;
    }

    getMasterById(id: number): Master {
        return this._masters.filter(m => m.id === id.toString())[0];
    }

    getMasterByStreamUrl(streamUrl: string): Master {
        return this._masters.filter(m => m.streamUrl === streamUrl)[0];
    }

}

export = MasterManager;