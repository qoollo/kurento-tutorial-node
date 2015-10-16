
var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var browserify = require('gulp-browserify');
var watch = require('gulp-watch');

gulp.task('default', ['build-server', 'build-client'], function () {
	gulp.watch('server/**/*.ts', ['build-server']);
	gulp.watch('web/**/*.ts', ['build-client']);	
});

gulp.task('build-server', ['compile-ts'], function() {
});

gulp.task('build-client', ['compile-ts', 'client'], function() {
});

gulp.task('client', ['compile-ts'], function () {
    return gulp.src('./web/js/index.js')
        .pipe(browserify({}))
        .pipe(gulp.dest('./web'));
});

gulp.task('compile-ts', function () {
	var tsProject = ts.createProject('tsconfig.json'),
		tsResult = tsProject.src()
			.pipe(sourcemaps.init())
			.pipe(ts(tsProject));
	return tsResult.js
		.pipe(sourcemaps.write('.', { 
			sourceRoot: __dirname 
		}))
		.pipe(gulp.dest('./'));
});