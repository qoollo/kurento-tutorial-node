
export function errorToString(err: any): string {
	var res: string = '';
	if (typeof err === 'string')
		res = err;
	else if (typeof err === 'object') {
		if ('name' in err) {
			res += err.name + ': ';
		}
		if ('message' in err) {
			res += err.message; Error
		}
	}

	return res;
}