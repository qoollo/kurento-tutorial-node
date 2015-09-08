
var gulp = require('gulp');
var ts = require('gulp-typescript');

gulp.task('default', function () {
    var tsResult = gulp.src(['./typings/**/*.d.ts', './script.ts'])
		.pipe(ts({
		    noImplicitAny: false,
		    target: 'ES5',
		    outFile: 'script.js',
		    out: 'script.js',
		    sortOutput: true,
		}));

    return tsResult.js
		.pipe(gulp.dest('./'));
});
