
var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var browserify = require('gulp-browserify');

gulp.task('default', ['server-ts']);

gulp.task('client', function () {
    return gulp.src('./static/js/index.js')
        .pipe(browserify({}))
        .pipe(gulp.dest('./static'));
});

gulp.task('server-ts', function () {
	var tsResult = gulp.src(['./typings/**/*.d.ts', './server.ts'])
		//.pipe(sourcemaps.init())
		.pipe(ts({
			noImplicitAny: false,
			target: 'ES5',
			outFile: 'server.js',
			out: 'server.js',
			sortOutput: true,
		    //module: 'commonjs'
		}));
	
	return tsResult.js
		//.pipe(sourcemaps.write())
		.pipe(gulp.dest('./'));
});