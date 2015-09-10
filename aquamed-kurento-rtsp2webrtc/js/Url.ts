/// <reference path="./UrlScheme.ts" />
/// <reference path="./Utils.ts" />

module CitySoft {

	export class Url {

		constructor(rawUrl: string) {
			if (!Utils.isString(rawUrl) || rawUrl.length === 0)
				throw new Error('ArgumentError: rawUrl must be non-empty string');

			this._rawUrl = rawUrl;
			this.parseUrl();
		}

		private get urlRegex(): RegExp {
			return /^(([a-z0-9]*\.?-?[a-z0-9]*):\/\/)?((\S*)?:(\S*)?@)?([a-zA-Z0-9\.]*)+(:(\d*))?(\/[^?]*)?(\?([^#]*))?(#(\w*))?$/;
		}

		public get scheme(): UrlScheme {
			return this._scheme;
		}
		private _scheme: UrlScheme;

		public get login(): string {
			return this._login;
		}
		private _login: string;

		public get password(): string {
			return this._password;
		}
		private _password: string;

		public get host(): string {
			return this._host;
		}
		private _host: string;

		public get port(): number {
			return this._port;
		}
		private _port: number;

		public get path(): string {
			return this._path;
		}
		private _path: string;

		public get params(): string {
			return this._params;
		}
		public get paramsObject(): Object {
			var res = {};
			if (Utils.isString(this._params)) {
				var parts = this._params.split('&');
				parts.forEach(p => {
					var kv = p.split('=');
					res[kv[0]] = kv[1];
				});
			}
			return res
		}
		public set paramsObject(obj: Object) {
			this._params = '';
			for (var f in obj) {
				this._params += f + '=' + obj[f] + '&';
			}
			if (this._params.lastIndexOf('&') !== -1)
				this._params = this._params.substring(0, this._params.length - 1);
			this.constructUrl();
		}
		private _params: string;

		public get anchor(): string {
			return this._anchor;
		}
		private _anchor: string;

		public get rawUrl(): string {
			return this._rawUrl;
		}
		private _rawUrl: string;

		private parseUrl(): void {
			var match = this._rawUrl.match(this.urlRegex);
			if (Utils.isString(match[1]))
				this._scheme = UrlScheme[match[2]];
			if (Utils.isString(match[3])) {
				this._login = match[4];
				this._password = match[5];
			}
			if (Utils.isString(match[6]))
				this._host = match[6];
			if (Utils.isString(match[7]))
				this._port = Number(match[8]);
			if (Utils.isString(match[9]))
				this._path = match[9];
			if (Utils.isString(match[10]))
				this._params = match[11];
			if (Utils.isString(match[12]))
				this._anchor = match[13];
		}

		private constructUrl(): void {
			var newUrl = '';
			if (Utils.isDefined(this._scheme))
				newUrl += Utils[this._scheme] + '://';
			if (Utils.isDefined(this._login) && Utils.isDefined(this._password))
				newUrl += this._login + ':' + this._password + '@';
			if (Utils.isDefined(this._host))
				newUrl += this._host;
			if (Utils.isDefined(this._port) && !isNaN(this._port))
				newUrl += this._port;
			if (Utils.isDefined(this._path))
				newUrl += this._path;
			if (Utils.isString(this._params) && this._params.length > 0)
				newUrl += '?' + this._params;
			if (Utils.isDefined(this._anchor))
				newUrl += '#' + this._anchor;
			this._rawUrl = newUrl;
		}
	}

}