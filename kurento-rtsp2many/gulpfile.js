
var gulp = require('gulp');
var ts = require('gulp-typescript');

gulp.task('default', ['server-ts']);

gulp.task('server-ts', function () {
	var tsResult = gulp.src(['./typings/**/*.d.ts', './server.ts'])
		.pipe(ts({
			noImplicitAny: false,
			target: 'ES5',
			outFile: 'server.js',
			out: 'server.js',
		}));
	
	return tsResult.js.pipe(gulp.dest('./'));
});