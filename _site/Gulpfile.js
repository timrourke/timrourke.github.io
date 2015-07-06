var gulp =            require('gulp');
var sass =            require('gulp-sass');
var sourcemaps =      require('gulp-sourcemaps');
var minifyCSS =       require('gulp-minify-css');
var mainBowerFiles =  require('main-bower-files');
var uglify =          require('gulp-uglify');
var concat =          require('gulp-concat');
var notify =          require('gulp-notify');
var autoprefixer =    require('gulp-autoprefixer');
var browserSync =     require('browser-sync').create();
var htmlmin =         require('gulp-htmlmin');
var jshint =          require('gulp-jshint');
var rename =          require('gulp-rename');
var responsive =      require('gulp-responsive');
var newer =           require('gulp-newer');
var changed =         require('gulp-changed');
var plumber =         require('gulp-plumber');

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
  gulp.run('html');
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
  browserSync.notify('Minifying HTML');
});

// html min
gulp.task("html", ['jekyll-rebuild'], function() {
  gulp.src("./_site/**/*.html")
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest("./_site/./"))
});

gulp.task('images', function() {
  browserSync.notify('Responsive images starting.');
  return gulp.src('images-source/**/*.{jpg,jpeg,png,tiff,webp,gif}')
    .pipe(newer('images-build'))
    .pipe(plumber())
    .pipe(responsive({
      '**/*.{jpg,png,tiff,webp,gif}': [{
          width: 320,
          rename: {
            suffix: "-320"
          },
          withoutEnlargment: true,
          passThroughUnused: true
      },{
          width: 480,
          rename: {
            suffix: "-480"
          },
          withoutEnlargment: true,
          passThroughUnused: true
      },{
          width: 640,
          rename: {
            suffix: "-640"
          },
          withoutEnlargment: true,
          passThroughUnused: true
      },{
          width: 800,
          rename: {
            suffix: "-800"
          },
          withoutEnlargment: true,
          passThroughUnused: true
      },{
          width: 1024,
          rename: {
            suffix: "-1024"
          },
          withoutEnlargment: true,
          passThroughUnused: true
      },{
          width: 1280,
          rename: {
            suffix: "-1280"
          },
          withoutEnlargment: true,
          passThroughUnused: true
      },{
          width: 1600,
          rename: {
            suffix: "-1600"
          },
          withoutEnlargment: true,
          passThroughUnused: true
      },{
          width: 1890,
          rename: {
            suffix: "-1890"
          },
          withoutEnlargment: true,
          passThroughUnused: true
      },{
          width: 2400,
          rename: {
            suffix: "-2400"
          },
          withoutEnlargment: true,
          passThroughUnused: true
      },{
          rename: {
            suffix: "-original"
          },
          withoutEnlargment: true,
          passThroughUnused: true
      }]
    }))
    .pipe(gulp.dest('images-build'));
});

// custom task to write responsive images filenames to yaml file
var fs = require('fs');
var map = require('map-stream');
var through2 = require('through2');
var async = require('async');
var _ = require('lodash');
var sizeOf = require('image-size');

gulp.task('respyaml', function() {

  var imgSrc = 'images-build/**/*.{jpg,jpeg,png,tiff,webp,gif}';

  var all = [];

  function getRelativePaths() {
    //Grab input from Gulp.src and pass along each file's relative paths to
    //our object-building functions.
    return (through2.obj(function (file, enc, callback) {
        this.push(file);

        callback();
      }))
      .on('data', function (file) {
        all.push(file.relative);
      })
      .on('end', function () {
        buildFileData(all);
      });
  }

  function buildFileData(array) {
    var relativePath = [];
    var fileNamesList = [];
    var extensions = [];
    var sizeName = [];

    //Iterate over file object and parse out individual elements to use for
    //final output into our yaml file.
    async.each(array, function(file, callback){
      relativePath.push(file);

      var nameStart;
      if ( file.lastIndexOf('/') !== -1 ) {
        nameStart = file.lastIndexOf('/') + 1;
      } else {
        nameStart = 0;
      }

      var nameEnd;
      if (file.lastIndexOf('-') !== -1) {
        nameEnd = file.lastIndexOf('-');
      } else {
        throw new Error('Warning! Responsive image file does not contain expected delimiter ("-") for end of filename.');
      }
      fileNamesList.push(file.substring(nameStart, nameEnd));

      var dotPosition = file.lastIndexOf('.');
      if ( dotPosition !== -1 ) {
          extensions.push(file.substring(dotPosition, file.length));
      } else {
        throw new Error('Warning! Responsive image file does not contain expected extension delimiter (".").');
      }

      //Because gulp-responsive doesn't give us easy access to
      //image dimensions via sharp.js, we must provide this info
      //ourselves with image-size.js.
      var sizeString = file.substring(nameEnd + 1, dotPosition);
      if ( sizeString === "original" ) {
        var size = sizeOf('./images-build/' + file);
        sizeName.push(size.width);
      } else {
          sizeName.push(sizeString);
      }

      callback();
    }, function(err) {
      if (err) {
        throw new Error('A file failed to process!');
      } else {
        console.log('All files processed.');

        buildFinalList(relativePath, fileNamesList, extensions, sizeName);
      }
    });
  }

  function buildFinalList(relativePath, fileNamesList, extensions, sizeName) {
    var finalList = [];
    var counter = 0;

    function builder(relativePath, fileNamesList, extensions, sizeName) {
      if (counter !== relativePath.length) {
        //Continue running until we reach end of our arrays
        var basePath;
        if (relativePath[counter].lastIndexOf('/') === -1) {
          basePath = relativePath[counter] + '/' + fileNamesList[counter];
        } else {
          basePath = relativePath[counter].substring(0, relativePath[counter].lastIndexOf('/')) + '/' + fileNamesList[counter];
        }
        var tempObj = {};
        tempObj.relativePath = relativePath[counter];
        tempObj.basePath = basePath;
        tempObj.fileName = fileNamesList[counter];
        tempObj.extension = extensions[counter];
        //Output from gulp-responsive names original file with '-original' suffix for clarity.
        //Not needed in final srcset object so ditch anything that is not a number.
        if ( !isNaN(parseInt(sizeName[counter])) ) {
          tempObj.sizeName = parseInt(sizeName[counter]);
        } else {
          tempObj.sizeName = null;
        }

        finalList.push(tempObj);
        counter++;
        builder(relativePath, fileNamesList, extensions, sizeName);
      } else {
        //This callback queues up our serial sorting of the arrays into something
        //sane to output to our yaml file.
        processFiles(finalList);
      }
    }
    //Initialize builder loop upon invocation of buildFinaList()
    builder(relativePath, fileNamesList, extensions, sizeName);
  }

  function processFiles(finalList) {

    var files = finalList;

    async.waterfall([

      //Should sort our file list alphabetically.
      function sortObjectsByName(cb) {
        async.sortBy(files, function(file, callback) {
          callback(null, file.fileName);
        }, function(err, sortedFiles) {
          cb(null, sortedFiles);
        });
      },

      //Split list into nested array where each unique image's srcset  values should be within one subarray
      function splitObject(results, cb) {
        var result = [];
        var counter = 0;
        result[0] = [];

        async.each(results, function(file, callback){
          if ( result[counter][0] && result[counter][0].fileName !== file.fileName ) {
              counter++;
              result[counter] = [];
          }
          result[counter].push(file);

          callback();
        }, function(err) {
          if (err) {
            throw new Error('An item failed to split into an object!');
          } else {
            cb(null, result);
            console.log('Object split successfully.');
          }
        });
      },

      function sortObjectsBySizename(finalList, cb) {
        var sortResult = [];

        async.each(finalList, function(item, callback) {
          //Using lodash instead of asunc here for a nested sort.
          //Probably a code smell. Had a hard time understanding
          //the syntax for async's sortBy function.
          var sorted = _.sortByOrder(item, 'sizeName', false);

          sortResult.push(sorted);

          callback();
        }, function(err) {
          if (err) {
            throw new Error('An object failed to sort by sizeName!');
          } else {
            //console.dir(sortResult);
            cb(null, sortResult);
            console.log('Object sorted by sizename successfully.');
          }
        });
      }

    ],
    //Final callback after successful series of sorts
    function(err, result) {
      buildYaml(result);
    });
  }

  function buildYaml(finalList) {
    var lastFileName = "";
    var output = fs.createWriteStream('./_data/images.yml');

    //Iterate over each sub-array of our nested array
    async.each(finalList, function(imageObject, callback){

      //Iterate over each line in each subarray to build text file
      async.each(imageObject, function(file, cb) {

        var outputLine = "";

        if (file.fileName !== lastFileName) {
          outputLine += '\n';
          outputLine += file.fileName + ':\n';
        }

        if (file.sizeName !== null) {
          outputLine += ' - ' + '"' + file.relativePath + ' ' + file.sizeName + 'w"\n';
        } else {
          outputLine += ' - ' + '"' + file.relativePath + '"\n';
        }

        lastFileName = file.fileName;

        output.write(outputLine)

        cb();
      }, function(err) {
        if (err) {
          throw new Error('An item failed to write to the output file!');
        } else {
          console.log('Item written to output.');
        }
      });

      callback();
    }, function(err) {
      if (err) {
        throw new Error('An item failed to build into an object!');
      } else {
        console.log('Object build successful.');
      }
    });
  }

  return gulp.src(imgSrc)
    .pipe(getRelativePaths());

});//end of custom task.

// watch tasks and serve via browserSync
gulp.task('serve', ['sass', 'sass-ie', 'jekyll-build', 'images'], function() {
  browserSync.init({
    proxy: 'timmytown.tim'
  });

  gulp.watch('images-source/**/*.{jpg,jpeg,png,tiff,webp,gif}', ['images']);
  gulp.watch('./js/**/*.js', ['js'])
  gulp.watch('./_scss/**', ['sass', 'sass-ie']);
  gulp.watch(['index.html', '_includes/**/*.html', '_layouts/**/*.html', '_posts/**/*.markdown', '_config.yml'], ['html']);
});

gulp.task('default', ['js', 'html', 'serve']);
