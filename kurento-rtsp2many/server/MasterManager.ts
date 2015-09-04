/// <reference path="IdCounter.ts" />
/// <reference path="Master.ts" />

class MasterManager {

    get masters(): Master[]{
        return this._masters;
    }
    private _masters: Master[] = [];

    private idCounter = new IdCounter();

    addMaster(master: Master): number {
        master.id = this.idCounter.nextUniqueId;
        this._masters.push(master);

        return master.id;
    }

    getMasterById(id: number): Master {
        return this._masters.filter(m => m.id === id)[0];
    }

}