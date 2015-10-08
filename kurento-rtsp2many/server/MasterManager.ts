/// <reference path="Master.ts" />

import IdCounterModule = require('./IdCounter');
var IdCounter = IdCounterModule.IdCounter;

import MasterModule = require('./Master');
type Master = MasterModule.Master;

export class MasterManager {

    get masters(): Master[]{
        return this._masters;
    }
    private _masters: Master[] = [];

    private idCounter = new IdCounter();

    addMaster(master: MasterModule.Master): Master {
        master.id = this.idCounter.nextUniqueId.toString();
        this._masters.push(master);

        return master;
    }

    getMasterById(id: number): Master {
        return this._masters.filter(m => m.id === id.toString())[0];
    }

    getMasterByStreamUrl(streamUrl: string): MasterModule.Master {
        return this._masters.filter(m => m.streamUrl === streamUrl)[0];
    }

}