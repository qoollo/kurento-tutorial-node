
var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('default', ['sample', 'distr']);

gulp.task('sample', getCompileTypeScriptTask('./script.ts', 'script.js'));
gulp.task('distr', getCompileTypeScriptTask('./src/KurentoRtspStreamingManager.ts', './distr/KurentoRtspStreamingManager.js'));

function getCompileTypeScriptTask(entranceFilePath, outFilePath, includeSourcesInMaps) {
    return function () {
        var tsResult = gulp.src(['./typings/**/*.d.ts', entranceFilePath])
            .pipe(sourcemaps.init())
            .pipe(ts({
                noImplicitAny: false,
                target: 'ES5',
                outFile: outFilePath,
                out: outFilePath,
                sortOutput: true,
            }));

        return tsResult.js
            .pipe(sourcemaps.write({ includeContent: false, sourceRoot: './' }))
            .pipe(gulp.dest('./'));
    }
}
