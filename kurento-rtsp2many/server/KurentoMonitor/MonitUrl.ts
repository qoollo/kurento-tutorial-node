import url = require('url');

class MonitUrl {
	public monitUrl: url.Url;
	
	public constructor(monitUrl: string) {
		if (monitUrl != null)
			this.monitUrl = url.parse(monitUrl);
	}
	
	public getUrl(): string {
		return url.format(this.monitUrl);
	}
}

export = MonitUrl;