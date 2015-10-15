import url = require('url');

export class MonitUrl {
	private _monitUrl: url.Url;
	
	public constructor(monitUrl: string) {
		this._monitUrl = url.parse(monitUrl);
	}
	
	public getUrl(): string {
		return url.format(this._monitUrl);
	}
	
	public get monitUrl(): url.Url {
		return this._monitUrl;
	}
}