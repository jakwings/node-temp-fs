var fs = require('fs');
var ps = require('path');
var ts = require(ps.join(__dirname, '..'));
var gc = require('./utils/gc');
var should = require('should').noConflict();
require('./utils/assertion')(should);


describe('tempfs.mkdir()', function () {

  it('should create a tmpdir in the default tmpdir', function (done) {
    ts.mkdir(function (err, tmpdir) {
      tmpdir != null && gc(tmpdir.path, true, true);
      should(err).be.null();
      should(tmpdir).be.a.tmpdir();
      var rpDir = fs.realpathSync(ts.dir());
      var rpTmpdir = fs.realpathSync(tmpdir.path);
      should(rpTmpdir).equal(ps.join(rpDir, ps.basename(rpTmpdir)));
      done();
    });
  });

  it('tmpdir.unlink() should delete the directory', function (done) {
    ts.mkdir(function (err, tmpdir) {
      tmpdir != null && gc(tmpdir.path, true, true);
      should(err).be.null();
      should(tmpdir).be.a.tmpdir();
      tmpdir.unlink();
      should(tmpdir.path).not.be.a.realpath();
      done();
    });
  });

  it('tmpdir.unlink(cb) should delete the directory and invoke cb', function (done) {
    ts.mkdir(function (err, tmpdir) {
      tmpdir != null && gc(tmpdir.path, true, true);
      should(err).be.null();
      should(tmpdir).be.a.tmpdir();
      tmpdir.unlink(function () {
        should(tmpdir.path).not.be.a.realpath();
        done();
      });
    });
  });

  it('tmpdir.mkdir({recursive: true})', function (done) {
    ts.mkdir({recursive: true}, function (err, tmpdir) {
      tmpdir != null && gc(tmpdir.path, true, true);
      should(err).be.null();
      should(tmpdir).be.a.tmpdir();
      ts.mkdir({dir: tmpdir.path}, function (err, subdir) {
        subdir != null && gc(subdir.path, true, true);
        should(err).be.null();
        should(subdir).be.a.tmpdir();
        tmpdir.unlink();
        should(tmpdir.path).not.be.a.realpath();
        should(subdir.path).not.be.a.realpath();
        done();
      });
    });
  });

});
