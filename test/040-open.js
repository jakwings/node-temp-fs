var fs = require('fs');
var ps = require('path');
var ts = require(ps.join(__dirname, '..'));
var gc = require('./utils/gc');
var should = require('should').noConflict();
require('./utils/assertion')(should);


describe('tempfs.open()', function () {

  it('should create a tmpfile in the default tmpdir', function (done) {
    ts.open(function (err, tmpfile) {
      tmpfile != null && gc(tmpfile.path, false, true);
      should(err).be.null;
      should(tmpfile).be.a.tmpfile;
      var rpDir = fs.realpathSync(ts.dir());
      var rpTmpfile = fs.realpathSync(tmpfile.path);
      should(rpTmpfile).equal(ps.join(rpDir, ps.basename(rpTmpfile)));
      done();
    });
  });

  it('tmpfile.unlink() should delete the file', function (done) {
    ts.open(function (err, tmpfile) {
      tmpfile != null && gc(tmpfile.path, false, true);
      should(err).be.null;
      should(tmpfile).be.a.tmpfile;
      tmpfile.unlink();
      should(tmpfile.path).not.be.a.realpath;
      done();
    });
  });

  it('tmpfile.unlink(cb) should delete the file and invoke cb', function (done) {
    ts.open(function (err, tmpfile) {
      tmpfile != null && gc(tmpfile.path, false, true);
      should(err).be.null;
      should(tmpfile).be.a.tmpfile;
      tmpfile.unlink(function () {
        should(tmpfile.path).not.be.a.realpath;
        done();
      });
    });
  });

});
