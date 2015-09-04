
class IdCounter {

    constructor(startId: number = 0) {
        this._lastId = startId - 1;
    }

    private _lastId: number;

    get nextUniqueId(): number {
        this._lastId++;
        return this._lastId;
    }
    get lastId(): number {
        return this._lastId;
    }
}