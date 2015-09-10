
module CitySoft {

	export class Utils {

		static isNumber(value): boolean {
			return typeof value === 'number';
		}

		static isString(value): boolean {
			return typeof value === 'string';
		}

		static isBoolean(value): boolean {
			return typeof value === 'boolean';
		}

		static isDate(value): boolean {
			return toString.call(value) === '[object Date]';
		}

		static isArray: (value) => boolean = Array.isArray;

		static isUndefined(value): boolean {
			return typeof value === 'undefined';
		}

		static isDefined(value): boolean {
			return typeof value !== 'undefined';
		}

		static isObject(value): boolean {
			// http://jsperf.com/isobject4
			return value !== null && typeof value === 'object';
		}

		static isFunction(value): boolean {
			return typeof value === 'function';
		}

		static isRegExp(value): boolean {
			return toString.call(value) === '[object RegExp]';
		}

		static isWindow(obj): boolean {
			return obj && obj.window === obj;
		}

		static isFile(obj): boolean {
			return toString.call(obj) === '[object File]';
		}

		static isFormData(obj): boolean {
			return toString.call(obj) === '[object FormData]';
		}


		static isBlob(obj): boolean {
			return toString.call(obj) === '[object Blob]';
		}

		static isPromiseLike(obj): boolean {
			return obj && Utils.isFunction(obj.then);
		}

		static isAngularScope(obj): boolean {
			return obj && obj.$evalAsync && obj.$watch;
		}



		private static toJsonReplacer(key, value) {
			var val = value;

			if (typeof key === 'string' && key.charAt(0) === '$' && key.charAt(1) === '$') {
				val = undefined;
			} else if (Utils.isWindow(value)) {
				val = '$WINDOW';
			} else if (value && document === value) {
				val = '$DOCUMENT';
			} else if (Utils.isAngularScope(value)) {
				val = '$SCOPE';
			}

			return val;
		}

		/**
		 * @ngdoc function
		 * @name angular.toJson
		 * @module ng
		 * @kind function
		 *
		 * @description
		 * Serializes input into a JSON-formatted string. Properties with leading $$ characters will be
		 * stripped since angular uses this notation internally.
		 *
		 * @param {Object|Array|Date|string|number} obj Input to be serialized into JSON.
		 * @param {boolean|number} [pretty=2] If set to true, the JSON output will contain newlines and whitespace.
		 *    If set to an integer, the JSON output will contain that many spaces per indentation.
		 * @returns {string|undefined} JSON-ified string representing `obj`.
		 */
		static toJson(obj, pretty): string {
			if (typeof obj === 'undefined') return undefined;
			if (!Utils.isNumber(pretty)) {
				pretty = pretty ? 2 : null;
			}
			return JSON.stringify(obj, Utils.toJsonReplacer, pretty);
		}

		/**
		 * @ngdoc function
		 * @name angular.fromJson
		 * @module ng
		 * @kind function
		 *
		 * @description
		 * Deserializes a JSON string.
		 *
		 * @param {string} json JSON string to deserialize.
		 * @returns {Object|Array|string|number} Deserialized JSON string.
		 */
		static fromJson(json: string): string {
			return Utils.isString(json)
				? JSON.parse(json)
				: json;
		}



		static timezoneToOffset(timezone: number | string, fallback: number): number {
			var requestedTimezoneOffset = Date.parse('Jan 01, 1970 00:00:00 ' + timezone) / 60000;
			return isNaN(requestedTimezoneOffset) ? fallback : requestedTimezoneOffset;
		}


		static addDateMinutes(date: Date, minutes: number): Date {
			date = new Date(date.getTime());
			date.setMinutes(date.getMinutes() + minutes);
			return date;
		}


		static convertTimezoneToLocal(date: Date, timezone: number, reverse): Date {
			reverse = reverse ? -1 : 1;
			var timezoneOffset = Utils.timezoneToOffset(timezone, date.getTimezoneOffset());
			return Utils.addDateMinutes(date, reverse * (timezoneOffset - date.getTimezoneOffset()));
		}
	}

}