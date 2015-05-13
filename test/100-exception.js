var cp = require('child_process');
var ps = require('path');
var ts = require(ps.join(__dirname, '..'));
var gc = require('./utils/gc');
var should = require('should').noConflict();
require('./utils/assertion')(should);


describe('uncaught exception', function () {

  it('should delete all tracked files and directories', function (done) {
    var child = cp.fork(ps.join(__dirname, 'utils', 'test-exception.js'), {
      silent: true
    });
    var tmpdirs = [];
    var tmpfiles = [];
    child.on('message', function (msg) {
      if ('fd' in msg) {
        var tmpfile = msg;
        tmpfile != null && gc(tmpfile.path, false, false);
        tmpfiles.push(tmpfile);
      } else {
        var tmpdir = msg;
        tmpdir != null && gc(tmpdir.path, true, false);
        tmpdirs.push(tmpdir);
      }
    });
    child.on('exit', function (exitcode, signal) {
      for (var i = 0; i < tmpdirs.length; i++) {
        should(tmpdirs[i].path).not.be.a.realpath;
      }
      for (var i = 0; i < tmpfiles.length; i++) {
        should(tmpfiles[i].path).not.be.a.realpath;
      }
      done();
    });
  });

});
