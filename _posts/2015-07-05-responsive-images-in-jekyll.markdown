---
layout: post
type:   post
title:  "Responsive Images in Jekyll"
date:   2015-07-05 20:32:46
categories:
  - Jekyll
tags:   ['Jekyll','gulp','responsive images']
description:  "Responsive images in Jekyll with Gulp and Liquid templating."
---

As a truly *static* site generator, Jekyll does not come with any built-in media library management tools. As a lazy programmer, I'm definitely not satisfied with the situation. Besides, I've been dying for a reason to try building a custom [Gulp](http://gulpjs.com/) task. Let's automate!

*Important note: this is my first ever Gulp task. It's probably in serious need of code review. I'd love your input!*

If you're new to responsive images, I've written about them briefly [here](http://timrourke.com/blog/tools/responsive-images-in-wordpress/). For a more detailed, beautifully illustrated writeup on the subject, [this article](https://ericportis.com/posts/2014/srcset-sizes/) by Eric Portis is hard to beat.

The Gulp task is a bit of a mess here. I've struggled to get a handle on managing the stream returned from a `gulp.src()` call from a big file-glob. I'm also quite new to managing asynchronous control flow, so your thoughts are more than welcome. Anyway, the files I'm grabbing for use in this task take the following form:

{% highlight bash %}
test-1024.jpg
test-1280.jpg
test-1600.jpg
test-1890.jpg
test-2400.jpg
test-320.jpg
test-480.jpg
test-640.jpg
test-800.jpg
test-original.jpg
{% endhighlight %}

Note that they all contain a baseline (hopefully unique) filename base, coupled with a suffix added by [gulp-responsive](https://github.com/mahnunchik/gulp-responsive), the excellent responsive images Gulp task you should probably be using for your image processing.

While the clunky Gulp task isn't incredibly well-commented yet, it serves as a good proof of concept. The 10,000 foot overview will be that we will be doing the following things to our images in this order:

  - Get all images in a given directory using `gulp.src`
  - Create a set of arrays for each file returned from our file-glob stream
  - Create an array of objects built from each (hopefully) unique base filename
  - Iterate over that array of objects to write to our images.yml file

## My icky monster of a Gulp task

{% highlight javascript %}
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
{% endhighlight %}

Yep, it's enormous, and probably overly complex, but for now, it works. Now for the fun part, actually generating the markup that will use our yaml data file. If we save the generated images.yml file under our Jekyll project's /_data/ folder, Jekyll will know that it can access that data when building up the final markup for the site.

## _includes/responsive_images.html

Using Liquid to iterate over looks something like this:

{{ "{% this " }}%}

{% highlight liquid %}
{{ "{% assign file = site.data.images[include.image] " }}%}
{{ "{% assign alt = include.alt " }}%}
{{ "{% assign fallback = file[0] | split: ' ' " }}%}
<img src="/images-build/{{ "{{ fallback[0] " }}}}" srcset="{{ "{% for srcItem in file " }}%}/images-build/{{ "{{ srcItem " }}}}{{ "{% if forloop.last == false " }}%}, {{ "{% endif " }}%}{{ "{% endfor " }}%}" alt="{{ "{{ alt " }}}}" />
{% endhighlight %}

## Including our partial

Actually implementing the markup looks something like this:

{% highlight liquid %}
{{ "{% include responsive_image.html image='test' alt='Houston, we have liftoff!' " }}%}
{% endhighlight %}

## Final output

If everything in my fragile system continues to work correctly, we should generate the following HTML markup in the end:

{% highlight html %}
<img src="/images-build/test/test-original.jpg" srcset="/images-build/test/test-original.jpg 4586w, /images-build/test/test-2400.jpg 2400w, /images-build/test/test-1890.jpg 1890w, /images-build/test/test-1600.jpg 1600w, /images-build/test/test-1280.jpg 1280w, /images-build/test/test-1024.jpg 1024w, /images-build/test/test-800.jpg 800w, /images-build/test/test-640.jpg 640w, /images-build/test/test-480.jpg 480w, /images-build/test/test-320.jpg 320w" alt="Houston, we have liftoff!">
{% endhighlight %}

There you have it! Not quite simple, almost clean, somewhat-easier-than-before automated responsive images in Jekyll. Whee!

{% include responsive_image.html image="test" alt="Houston, we have liftoff!" %}
