var fs = require('fs');
var ps = require('path');
var rm = require('rimraf');


var dirs = {};
var files = {};

var clear = function () {
  for (var path in files) {
    try {
      if (files[path]) {
        fs.unlinkSync(path);
      } else {
        rm.sync(path);
      }
    } catch (e) {}
    delete files[path];
  }
  for (var path in dirs) {
    try {
      if (dirs[path]) {
        fs.rmdirSync(path);
      } else {
        rm.sync(path);
      }
    } catch (e) {}
    delete dirs[path];
  }
};

process.addListener('exit', function () {
  clear();
});

var onUncaughtException = function (err) {
  clear();
  throw err;
};
process.addListener('uncaughtException', onUncaughtException);

module.exports = function (path, isDirectory, allowOutOfDir) {
  var dangerous = false;
  try {
    path = fs.realpathSync(path);
    var dirpath = fs.realpathSync(ps.join(__dirname, '..', 'playground'));
    var isOutOfDir = false;
    if (path.substr(0, dirpath.length) != dirpath ||
        (path[dirpath.length] && path[dirpath.length] != ps.sep)) {
      isOutOfDir = true;
    }
    if (isOutOfDir && !allowOutOfDir) {
      dangerous = true;
      throw new Error('Forbidden to delete files out of the test directory.');
    }
    if (isDirectory) {
      dirs[path] = isOutOfDir;
    } else {
      files[path] = isOutOfDir;
    }
  } catch (err) {
    if (dangerous) {
      throw err;
    }
  }
};
