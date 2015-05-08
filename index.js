var fs = require('fs');
var os = require('os');
var ps = require('path');
var cs = require('crypto');
var rm = require('rimraf');


var IS_WINDOWS = process.platform === 'win32';
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
var manuallyTrackedDirs = {};
var manuallyTrackedFiles = {};

process.addListener('exit', function (exitcode) {
  if (tracking) {
    clearSync();
  } else {
    clearManuallyTracked();
  }
});
process.addListener('uncaughtException', function (err) {
  clearSync();
});

/* History:
 * https://github.com/joyent/node/blob/a11bf99ce0dae4d8f4de8a9c0c32159c1a9ecfbf/lib/os.js#L42-L47
 * https://github.com/joyent/node/blob/120e5a24df76deb5019abec9744ace94f0f3746a/lib/os.js#L45-L56
 * https://github.com/iojs/io.js/blob/6c80e38b014b7be570ffafa91032a6d67d7dd4ae/lib/os.js#L25-L40
 */
function tmpdir() {
  var path;
  if (IS_WINDOWS) {
    path = process.env.TEMP || process.env.TMP ||
           (process.env.SystemRoot || process.env.windir) + '\\temp';
  } else {
    path = process.env.TMPDIR || process.env.TMP || process.env.TEMP || '/tmp';
  }
  return ps.resolve(path);
}

function track(on) {
  tracking = (on == null ? true : Boolean(on));
}

function clearManuallyTracked() {
  for (var k in manuallyTrackedFiles) {
    manuallyTrackedFiles[k] && manuallyTrackedFiles[k]();
  }
  for (var k in manuallyTrackedDirs) {
    manuallyTrackedDirs[k] && manuallyTrackedDirs[k]();
  }
}

function clearSync() {
  for (var k in trackedFiles) {
    trackedFiles[k] && trackedFiles[k]();
  }
  for (var k in manuallyTrackedFiles) {
    manuallyTrackedFiles[k] && manuallyTrackedFiles[k]();
  }
  for (var k in trackedDirs) {
    trackedDirs[k] && trackedDirs[k]();
  }
  for (var k in manuallyTrackedDirs) {
    manuallyTrackedDirs[k] && manuallyTrackedDirs[k]();
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
  for (var k in manuallyTrackedFiles) {
    if (manuallyTrackedFiles[k]) {
      jobs.push(function (next) {
        manuallyTrackedFiles[k](next);
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
  for (var k in manuallyTrackedDirs) {
    if (manuallyTrackedDirs[k]) {
      jobs.push(function (next) {
        manuallyTrackedDirs[k](next);
      });
    }
  }
  callback && jobs.push(function (next) { callback(); });
  queue(jobs);
}

function generateFileUnlinker(fd, path, manually) {
  var called = false;
  var unlink = function unlink(callback) {
    if (called) {
      callback && process.nextTick(callback);
      return;
    }
    called = true;
    if (callback) {
      fs.unlink(path, function (err) {
        if (manually) {
          if (manuallyTrackedFiles[fd] === unlink) {
            delete manuallyTrackedFiles[fd];
          }
        } else if (trackedFiles[fd] === unlink) {
          delete trackedFiles[fd];
        }
        callback && callback();
      });
    } else {
      try {
        fs.unlinkSync(path);
      } finally {
        if (manually) {
          if (manuallyTrackedFiles[fd] === unlink) {
            delete manuallyTrackedFiles[fd];
          }
        } else if (trackedFiles[fd] === unlink) {
          delete trackedFiles[fd];
        }
      }
    }
  };
  if (manually) {
    manuallyTrackedFiles[fd] = unlink;
  } else {
    trackedFiles[fd] = unlink;
  }
  return unlink;
}

function generateDirUnlinker(recursive, path, manually) {
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
        if (manually) {
          if (manuallyTrackedDirs[path] === unlink) {
            delete manuallyTrackedDirs[path];
          }
        } else if (trackedDirs[path] === unlink) {
          delete trackedDirs[path];
        }
        callback && callback();
      });
    } else {
      var rmdirSync = recursive ? rm.sync.bind(rm) : fs.rmdirSync.bind(fs);
      try {
        rmdirSync(path);
      } finally {
        if (manually) {
          if (manuallyTrackedDirs[path] === unlink) {
            delete manuallyTrackedDirs[path];
          }
        } else if (trackedDirs[path] === unlink) {
          delete trackedDirs[path];
        }
      }
    }
  };
  if (manually) {
    manuallyTrackedDirs[path] = unlink;
  } else {
    trackedDirs[path] = unlink;
  }
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
        if (!trackedFiles[fd] && !manuallyTrackedFiles[fd]) {
          unlink = generateFileUnlinker(fd, path, Boolean(opts.track));
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
      if (!trackedFiles[fd] && !manuallyTrackedFiles[fd]) {
        unlink = generateFileUnlinker(fd, path, Boolean(opts.track));
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
        if (!trackedDirs[path] && !manuallyTrackedDirs[path]) {
          unlink = generateDirUnlinker(recursive, path, Boolean(opts.track));
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
      if (!trackedDirs[path] && !manuallyTrackedDirs[path]) {
        unlink = generateDirUnlinker(recursive, path, Boolean(opts.track));
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
    return ps.join(opts.dir || tmpdir(), opts.name);
  }
  if (opts.template) {
    if (TEMPLATE_RE.test(opts.template)) {
      var name = opts.template.replace(TEMPLATE_RE, function (s) {
        return randomString(s.length);
      });
      return ps.join(opts.dir || tmpdir(), name);
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
  return ps.join(opts.dir || tmpdir(), name);
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
  dir: tmpdir
};
