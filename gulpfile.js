var gulp = require('gulp');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var livereload = require('gulp-livereload');

gutil.env.type = gutil.env.type || 'DEV';

var DIST_PATH = './public/';

// Task to delete previous build files
var del = require('del');
gulp.task('clean', function() {
    return del.sync([
        DIST_PATH + '**/*',
        '!' + DIST_PATH + '.gitkeep'
    ]);
});

// JsHint
var jshint = require('gulp-jshint');
gulp.task('jshint', function() {
    return gulp.src(['app/**/*.js', 'api/**/*.js', 'gulpfile.js', 'server.js'])
            .pipe(jshint())
            .pipe(jshint.reporter('default'));
});

// Task to convert angular .ts files to js
var ts = require('gulp-typescript');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
gulp.task('tsc', function() {
    var _tsProject = ts.createProject('tsconfig.json');
    return _tsProject.src()
            .pipe(sourcemaps.init())
            .pipe(_tsProject())
            .js
            .pipe(gutil.env.type === 'production' ? uglify() : gutil.noop())
            .pipe(sourcemaps.write('.'))
            .pipe(rename(function (path) {
                if (path.dirname.match(/^app/)) {
                    path.dirname = path.dirname.substr(4);
                }
            }))
            .pipe(gulp.dest(DIST_PATH));
});

// Task to convert sass files to css
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
gulp.task('sass', function() {
    gulp.src('app/styles/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({onError: function(e) { console.log(e);} }))
        .pipe(concat('style.css'))
        .pipe(autoprefixer('last 2 versions', '> 1%', 'ie 8'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(DIST_PATH + 'styles'))
        .pipe(livereload());
});

// Copy files to dist
gulp.task('copy', function() {
    gulp.src(['app/**/*.html'])
        .pipe(gulp.dest(DIST_PATH));

    gulp.src(['app/images/**/*'])
        .pipe(gulp.dest(DIST_PATH + 'images'));

    gulp.src(['app/scripts/**/*.js'])
        .pipe(gulp.dest(DIST_PATH + 'scripts'));
});

gulp.task('default', ['clean', 'jshint', 'copy', 'sass', 'tsc'], function() {
    gutil.log('New build for env =', gutil.env.type, 'complete.');
});

var nodemon = require('gulp-nodemon');
gulp.task('watch', ['default'], function() {
    gutil.log("Watching for changes to app...");
    livereload.listen();
    gulp.watch(['gulpfile.js'], ['default']);
    gulp.watch(['app/**/*.scss'], ['sass']);
    gulp.watch(['app/**/*.js',
                'app/**/*.html',
                'app/images/**/*'], ['copy']);
    gulp.watch(['app/**/*.ts'], ['tsc']);
    gulp.watch('api/**/*.js', ['jshint']);

    nodemon({
        script: 'server.js',
        env: {'NODE_ENV' : 'development'},
        watch: ['api/', 'server.js'],
        ignore: ['app/']
    });
});
