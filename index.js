var fs = require('fs');
var os = require('os');
var ps = require('path');
var cs = require('crypto');
var rm = require('rimraf');


var SYS_DIR_MODE = 0700;
var SYS_FILE_MODE = 0600;
var SYS_FILE_FLAGS = 'wx+';
var TEMPLATE_RE = /X+/g;
var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';


var noop = function (callback) {
  callback && process.nextTick(callback);
};
var tracking = false;
var trackedDirs = {};
var trackedFiles = {};

process.addListener('exit', function (exitcode) {
  tracking && clearSync();
});


function track(on) {
  tracking = (on == null ? true : Boolean(on));
}

function clearSync() {
  for (var k in trackedFiles) {
    trackedFiles[k] && trackedFiles[k]();
  }
  for (var k in trackedDirs) {
    trackedDirs[k] && trackedDirs[k]();
  }
}

function clear(callback) {
  var jobs = [];
  for (var k in trackedFiles) {
    if (trackedFiles[k]) {
      jobs.push(function (next) {
        trackedFiles[k](next);
      });
    }
  }
  for (var k in trackedDirs) {
    if (trackedDirs[k]) {
      jobs.push(function (next) {
        trackedDirs[k](next);
      });
    }
  }
  callback && jobs.push(function (next) { callback(); });
  queue(jobs);
}

function generateFileUnlinker(fd, path) {
  var called = false;
  var unlink = function unlink(callback) {
    if (called) {
      callback && process.nextTick(callback);
      return;
    }
    called = true;
    this.called = true;
    if (callback) {
      fs.unlink(path, function (err) {
        if (trackedFiles[fd] === unlink) {
          delete trackedFiles[fd];
        }
        callback && callback();
      });
    } else {
      try {
        fs.unlinkSync(path);
      } finally {
        if (trackedFiles[fd] === unlink) {
          delete trackedFiles[fd];
        }
      }
    }
  };
  trackedFiles[fd] = unlink;
  return unlink;
}

function generateDirUnlinker(recursive, path) {
  var called = false;
  var unlink = function unlink(callback) {
    if (called) {
      callback && process.nextTick(callback);
      return;
    }
    called = true;
    if (callback) {
      var rmdir = recursive ? rm : fs.rmdir.bind(fs);
      rmdir(path, function (err) {
        if (trackedDirs[path] === unlink) {
          delete trackedDirs[path];
        }
        callback && callback();
      });
    } else {
      var rmdirSync = recursive ? rm.sync.bind(rm) : fs.rmdirSync.bind(fs);
      try {
        rmdirSync(path);
      } finally {
        if (trackedDirs[path] === unlink) {
          delete trackedDirs[path];
        }
      }
    }
  };
  trackedDirs[path] = unlink;
  return unlink;
}

function queue(jobs) {
  var next = function() {
    if (jobs.length && !this.called) {
      this.called = true;
      jobs.shift()(next.bind({}));
    }
  };
  next.call({});
}

function registerFilename(name, opts, callback) {
  fs.open(name, SYS_FILE_FLAGS, opts.mode || SYS_FILE_MODE, function (err, fd) {
    if (err) {
      callback(null);
      return;
    }
    fs.realpath(name, function (err, path) {
      if (err) {
        callback(null);
        return;
      }
      var unlink;
      if (opts.track || (opts.track == null && tracking)) {
        if (!trackedFiles[fd]) {
          unlink = generateFileUnlinker(fd, path);
        } else {
          throw new Error("Didn't you delete files via file.unlink()?");
        }
      } else {
        unlink = noop;
      }
      callback({path: path, fd: fd, unlink: unlink});
    });
  });
}

function generateFile() {
  var args = getArgs(arguments);
  var opts = args[0];
  var callback = args[1];
  var limit = opts.limit || 5;
  var registerCallback = function (file) {
    if (limit-- >= 0) {
      if (file) {
        callback && callback(null, file);
      } else {
        registerFilename(generateName(opts), opts, registerCallback);
      }
    } else {
      var err = new Error('Failed to get a temporary file within limits.');
      callback && callback(err, null);
    }
  };
  registerFilename(generateName(opts), opts, registerCallback);
}

function registerFilenameSync(name, opts) {
  try {
    var fd = fs.openSync(name, SYS_FILE_FLAGS, opts.mode || SYS_FILE_MODE);
    var path = fs.realpathSync(name);
    var unlink;
    if (opts.track || (opts.track == null && tracking)) {
      if (!trackedFiles[fd]) {
        unlink = generateFileUnlinker(fd, path);
        trackedFiles[fd] = unlink;
      } else {
        throw new Error("Didn't you delete files via file.unlink()?");
      }
    } else {
      unlink = noop;
    }
    return {path: path, fd: fd, unlink: unlink};
  } catch (err) {
    return null;
  }
}

function generateFileSync(opts) {
  opts = opts || {};
  var limit = opts.limit || 5;
  do {
    var file = registerFilenameSync(generateName(opts), opts);
    if (file) {
      return file;
    }
  } while (limit-- > 0);
  throw new Error('Failed to get a temporary file within limits.');
}

function registerDirname(name, opts, callback) {
  fs.mkdir(name, opts.mode || SYS_DIR_MODE, function (err) {
    if (err) {
      callback(null);
      return;
    }
    fs.realpath(name, function (err, path) {
      if (err) {
        callback(null);
        return;
      }
      var unlink;
      var recursive = Boolean(opts.recursive);
      if (opts.track || (opts.track == null && tracking)) {
        if (!trackedDirs[path]) {
          unlink = generateDirUnlinker(recursive, path);
        } else {
          throw new Error("Didn't you delete directories via directory.unlink()?");
        }
      } else {
        unlink = noop;
      }
      callback({path: path, recursive: recursive, unlink: unlink});
    });
  });
}

function generateDir() {
  var args = getArgs(arguments);
  var opts = args[0];
  var callback = args[1];
  var limit = opts.limit || 5;
  var registerCallback = function (dir) {
    if (limit-- >= 0) {
      if (dir) {
        callback && callback(null, dir);
      } else {
        registerDirname(generateName(opts), opts, registerCallback);
      }
    } else {
      var err = new Error('Failed to get a temporary directory within limits.');
      callback && callback(err, null);
    }
  };
  registerDirname(generateName(opts), opts, registerCallback);
}

function registerDirnameSync(name, opts) {
  try {
    fs.mkdirSync(name, opts.mode || SYS_DIR_MODE);
    var path = fs.realpathSync(name);
    var unlink;
    var recursive = Boolean(opts.recursive);
    if (opts.track || (opts.track == null && tracking)) {
      if (!trackedDirs[path]) {
        unlink = generateDirUnlinker(recursive, path);
      } else {
        throw new Error("Didn't you delete directories via directory.unlink()?");
      }
    } else {
      unlink = noop;
    }
    return {path: path, recursive: recursive, unlink: unlink};
  } catch (err) {
    return null;
  }
}

function generateDirSync(opts) {
  opts = opts || {};
  var limit = opts.limit || 5;
  do {
    var dir = registerDirnameSync(generateName(opts), opts);
    if (dir) {
      return dir;
    }
  } while (limit-- > 0);
  throw new Error('Failed to get a temporary directory within limits.');
}

function getArgs(args) {
  var opts, callback;
  if (typeof args[0] === 'function') {
    opts = args[1];
    callback = args[0];
  } else {
    opts = args[0];
    callback = args[1];
  }
  opts = opts || {};
  return [opts, callback];
}

function randomString(length) {
  var buffer;
  try {
    buffer = cs.randomBytes(length);
  } catch (err) {
    buffer = cs.pseudoRandomBytes(length);
  }
  var chars = [];
  for (var i = 0; i < length; i++) {
    chars.push(CHARS[buffer[i]%CHARS.length]);
  }
  return chars.join('');
}

function generateName(opts) {
  opts = opts || {};
  if (opts.name) {
    return ps.join(opts.dir || os.tmpDir(), opts.name);
  }
  if (opts.template) {
    if (TEMPLATE_RE.test(opts.template)) {
      var name = opts.template.replace(TEMPLATE_RE, function (s) {
        return randomString(s.length);
      });
      return ps.join(opts.dir || os.tmpDir(), name);
    } else {
      throw new Error('Invalid template string.');
    }
  }
  var name = [
    opts.prefix || 'tmp-',
    Date.now(),
    '-',
    process.pid,
    '-',
    randomString(12),
    opts.suffix || ''
  ].join('');
  return ps.join(opts.dir || os.tmpDir(), name);
}


module.exports = {
  track: track,
  clear: clear,
  clearSync: clearSync,
  open: generateFile,
  openSync: generateFileSync,
  mkdir: generateDir,
  mkdirSync: generateDirSync,
  name: generateName,
  dir: function () { return ps.resolve(os.tmpDir()); }
};
