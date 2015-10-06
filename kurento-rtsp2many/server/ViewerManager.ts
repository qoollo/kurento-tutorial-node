/// <reference path="IdCounter.ts" />
/// <reference path="Master.ts" />

class ViewerManager {

    get viewers(): Viewer[] {
        return this._viewers;
    }
    private _viewers: Viewer[] = [];

    private idCounter = new IdCounter();

    addViewer(viewer: Viewer): Viewer {
        viewer.sessionId = this.idCounter.nextUniqueId;
        this._viewers.push(viewer);

        return viewer;
    }

    getViewerBySessionId(id: number): Viewer {
        return this._viewers.filter(m => m.sessionId === id)[0];
    }

    getViewerByStreamUrl(streamUrl: string): Viewer {
        return this._viewers.filter(m => m.streamUrl === streamUrl)[0];
    }

}