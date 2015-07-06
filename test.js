var fs = require('fs');

fs.stat('./images-build/test/test-original.jpg', function(err, file){
  console.log(file.isFile());
});
