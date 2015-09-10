
module CitySoft {

    export class Disposable {

        dispose(): void {
            this._disposed = true;
        }
        private _disposed: boolean = false;

        protected get disposed(): boolean {
            return this._disposed;
        }

        protected throwIfDisposed(errorMessage?: string): void {
            if (this._disposed)
                throw new ObjectDisposedError(errorMessage);
        }
    }

    export class ObjectDisposedError implements Error {

        constructor(private _message: string = '') {
        }

        get name(): string {
            return 'ObjectDisposedError';
        }

        get message(): string {
            return this._message;
        }
    }

}