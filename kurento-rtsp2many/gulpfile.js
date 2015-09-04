
var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('default', ['server-ts']);

gulp.task('server-ts', function () {
	var tsResult = gulp.src(['./typings/**/*.d.ts', './server.ts'])
		//.pipe(sourcemaps.init())
		.pipe(ts({
			noImplicitAny: false,
			target: 'ES5',
			outFile: 'server.js',
			out: 'server.js',
			sortOutput: true,
		}));
	
	return tsResult.js
		//.pipe(sourcemaps.write())
		.pipe(gulp.dest('./'));
});