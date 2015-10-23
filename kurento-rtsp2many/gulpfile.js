
var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var browserify = require('gulp-browserify');
var watch = require('gulp-watch');
var path = require('path');
var install = require("gulp-install"),
	console = require('better-console'),
	merge = require('merge2'),
	rename = require('gulp-rename'),
	cleanDest = require('gulp-clean-dest');
	
var tsProject = ts.createProject('tsconfig.json');

gulp.task('default', ['npm-install', 'build-server', 'build-client', 'build-tests'], function () {
	gulp.watch('server/**/*.ts', ['build-server']);
	gulp.watch('web/**/*.ts', ['build-client']);
	gulp.watch('tests/**/*.ts', ['build-tests']);
});

gulp.task('npm-install', function () {
	return gulp.src(['./package.json'])
  		.pipe(install());
})

gulp.task('build-server', ['compile-ts'], function() {
});

gulp.task('build-client', ['compile-ts', 'client'], function() {
});

gulp.task('build-tests', ['compile-ts'], function() {
});

gulp.task('client', ['compile-ts'], function () {
    return gulp.src('./web/js/index.js')
        .pipe(browserify({}))
        .pipe(gulp.dest('./web'));
});

gulp.task('compile-ts', function () {	
	var tsResult = tsProject.src()
		.pipe(sourcemaps.init())
		.pipe(ts(tsProject));
	return tsResult.js
		.pipe(sourcemaps.write('.', { 
			sourceRoot: __dirname 
		}))
		.pipe(gulp.dest('./'));
});

gulp.task('release-client', ['compile-ts'], function () {
	return gulp.src('./web/js/Api.js')
        .pipe(browserify({}))
		.pipe(rename('KurentoHubClient.js'))
        .pipe(gulp.dest('./release/client'));
});

gulp.task('release-server', ['compile-ts'], function () {
	return gulp.src([
		'./.crossbar/config.json',
		'./server/**/*.js',
		'./web/**/*.*',
		'./package.json',
		'./README.md'], { base: "./" })
		.pipe(cleanDest('./release/server'))
		.pipe(gulp.dest('./release/server'));
})