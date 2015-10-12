
var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var browserify = require('gulp-browserify');

gulp.task('default', ['compile-ts', 'client']);

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
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('./'));
			
	
	
	var tsResult = gulp.src('./**/*.ts')
		//.pipe(sourcemaps.init())
		.pipe(ts({
			//noImplicitAny: false,
			target: 'ES5',
			//outFile: 'server.js',
			//out: 'server.js',
			//sortOutput: true,
		    module: 'commonjs'
		}));
	
	return tsResult.js
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('./'));
});