

abstract class WampEndpointPath {

    constructor(type: string, path: string) {
        this._type = type;
        this._path = path;
    }

    public get type(): string {
        return this._type;
    }
    private _type: string;

    public get path(): string {
        return this._path;
    }
    private _path: string;
}

export = WampEndpointPath;