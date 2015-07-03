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
var htmlmin = require('gulp-htmlmin');
var jshint = require('gulp-jshint');
var rename = require('gulp-rename');

// libsass
gulp.task('sass', function () {
  return gulp.src('./_scss/style.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
      includePaths: [
        './node_modules/susy/sass' //required for sass
      ]
    }))
    .pipe(autoprefixer('> 5%', 'last 2 version', 'Firefox ESR', 'Opera 12.1', 'ie 11', 'ie 10', 'ie 9'))
    .pipe(minifyCSS()) //move to prod settings
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./css/'))
    .pipe(gulp.dest('./_site/css/'))
    .pipe(browserSync.stream());
});

// libsass for ie stylsheets
gulp.task('sass-ie', function () {
  return gulp.src('./_scss/style-ie.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
      includePaths: [
        './node_modules/susy/sass' //required for sass
      ]
    }))
    .pipe(autoprefixer('> 5%', 'last 2 version', 'Firefox ESR', 'Opera 12.1', 'ie 11', 'ie 10', 'ie 9'))
    .pipe(minifyCSS()) //move to prod settings
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./css/'))
    .pipe(gulp.dest('./_site/css/'))
    .pipe(browserSync.stream());
});

// javascripts
gulp.task('js', ['bower'], function() {
  return gulp.src(['./js/vendor/vendor.js', './js/global.js'])
    .pipe(concat('./js-build/global.build.js'))
    .pipe(jshint())
    .pipe(rename('global.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./js-build/'))
    .pipe(gulp.dest('./_site/js-build/'))
    .pipe(browserSync.stream());
});

// grab all main bower files, concat them, and put into my vendor.js file
gulp.task('bower', function() {
  return gulp.src(mainBowerFiles(), { base: './bower_components/**'})
    .pipe(sourcemaps.init())
    .pipe(concat('vendor.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./js/vendor/'))
    .pipe(gulp.dest('./_site/js/vendor/'));
});

// run jekyll build
gulp.task('jekyll-build', function(gulpCallBack) {
  browserSync.notify('Building Jekyll');
  var spawn = require('child_process').spawn;
  var jekyll = spawn('bundle', ['exec', 'jekyll', 'build'], {stdio: 'inherit'});

  jekyll.on('exit', function(code) {
    gulpCallBack(code === 0 ? null : 'ERROR: Jekyll process exited with code ' + code);
  });
});

gulp.task('archive-gen', ['jekyll-build'], function(gulpCallBack) {
  browserSync.notify('Generating Archives');
  var spawn = require('child_process').spawn;
  var archive = spawn('ruby', ['archive/_generator.rb'], {stdio: 'inherit'});

  archive.on('exit', function(generatorCode) {
      gulpCallBack(generatorCode === 0 ? null : 'ERROR: Archive generator process exited with code ' + code);
  });
});

gulp.task('jekyll-rebuild', ['jekyll-build', 'archive-gen', 'jekyll-build'], function() {
  browserSync.reload();
});

// watch tasks and serve via browserSync
gulp.task('serve', ['sass', 'sass-ie', 'jekyll-build'], function() {
  browserSync.init({
    proxy: 'timmytown.tim'
  });

  gulp.watch('./js/**/*.js', ['js'])
  gulp.watch('./_scss/**', ['sass', 'sass-ie']);
  gulp.watch(['index.html', '_includes/**/*.html', '_layouts/**/*.html', '_posts/**/*.markdown', '_config.yml'], ['jekyll-rebuild']);
});

gulp.task('default', ['js', 'jekyll-rebuild', 'serve']);
