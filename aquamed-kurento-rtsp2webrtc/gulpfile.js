
var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('default', function () {
    var tsResult = gulp.src(['./typings/**/*.d.ts', './script.ts'])
        .pipe(sourcemaps.init())
		.pipe(ts({
		    noImplicitAny: false,
		    target: 'ES5',
		    outFile: 'script.js',
		    out: 'script.js',
		    sortOutput: true,
		}));

    return tsResult.js
        .pipe(sourcemaps.write())
		.pipe(gulp.dest('./'));
});
