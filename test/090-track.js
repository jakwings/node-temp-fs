var cp = require('child_process');
var ps = require('path');
var ts = require(ps.join(__dirname, '..'));
var should = require('should').noConflict();
require('./utils/assertion')(should);


describe('tempfs.track()', function () {

  it('tempfs.track(on = true)', function () {
    var child = cp.fork(ps.join(__dirname, 'utils', 'test-track-on.js'));
    var tmpfile = null;
    child.on('message', function (msg) {
      tmpfile = msg;
      should(tmpfile).be.a.tmpfile;
    });
    child.on('exit', function (exitcode, signal) {
      should(tmpfile.path).not.be.a.realpath;
    });
  });

  it('tempfs.track(false)', function () {
    var child = cp.fork(ps.join(__dirname, 'utils', 'test-track-off.js'));
    var tmpfile = null;
    child.on('message', function (msg) {
      tmpfile = msg;
      should(tmpfile).be.a.tmpfile;
    });
    child.on('exit', function (exitcode, signal) {
      should(tmpfile.path).not.be.a.realpath;
    });
  });

});
