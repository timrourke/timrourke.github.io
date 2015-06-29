var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var minifyCSS = require('gulp-minify-css');
var mainBowerFiles = require('main-bower-files');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var notify = require('gulp-notify');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();

//libsass
gulp.task('sass', function () {
    return gulp.src('./scss/style.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({
            includePaths: [
                './node_modules/susy/sass' //required for sass
            ]
        }))
        .pipe(autoprefixer('> 5%', 'last 2 version', 'Firefox ESR', 'Opera 12.1', 'ie 11', 'ie 10', 'ie 9'))
        .pipe(minifyCSS()) //move to prod settings
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./styles/'))
        .pipe(browserSync.stream());
});

gulp.task('sass-ie', function () {
    return gulp.src('./scss/style-ie.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({
            includePaths: [
                './node_modules/susy/sass' //required for sass
            ]
        }))
        .pipe(autoprefixer('> 5%', 'last 2 version', 'Firefox ESR', 'Opera 12.1', 'ie 11', 'ie 10', 'ie 9'))
        .pipe(minifyCSS()) //move to prod settings
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./styles/'))
        .pipe(browserSync.stream());
});

gulp.task('bower', function() {
    return gulp.src(mainBowerFiles(), { base: './bower_components/**'})
        .pipe(sourcemaps.init())
        .pipe(concat('vendor.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./public/js/vendor/'))
        .pipe(notify({ message: 'Bower task complete.' }));
});

gulp.task('serve', ['sass', 'sass-ie'], function() {

    browserSync.init({
        proxy: 'timmytown.tim'
    });

    gulp.watch('./bower_components/**', ['bower']);
    gulp.watch('./scss/**', ['sass', 'sass-ie']);
    gulp.watch('./**/*.html').on('change', browserSync.reload);
});

gulp.task('default', ['sass', 'sass-ie', 'bower', 'serve']);
