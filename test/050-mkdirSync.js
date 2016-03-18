var fs = require('fs');
var ps = require('path');
var ts = require(ps.join(__dirname, '..'));
var gc = require('./utils/gc');
var should = require('should').noConflict();
require('./utils/assertion')(should);


describe('tempfs.mkdirSync()', function () {

  it('should create a tmpdir in the default tmpdir', function () {
    var tmpdir = ts.mkdirSync();
    tmpdir != null && gc(tmpdir.path, true, true);
    should(tmpdir).be.a.tmpdir();
    var rpDir = fs.realpathSync(ts.dir());
    var rpTmpdir = fs.realpathSync(tmpdir.path);
    should(rpTmpdir).equal(ps.join(rpDir, ps.basename(rpTmpdir)));
  });

  it('tmpdir.unlink() should delete the directory', function () {
    var tmpdir = ts.mkdirSync();
    tmpdir != null && gc(tmpdir.path, true, true);
    should(tmpdir).be.a.tmpdir();
    tmpdir.unlink();
    should(tmpdir.path).not.be.a.realpath();
  });

  it('tmpdir.unlink(cb) should delete the directory and invoke cb', function (done) {
    var tmpdir = ts.mkdirSync();
    tmpdir != null && gc(tmpdir.path, true, true);
    should(tmpdir).be.a.tmpdir();
    tmpdir.unlink(function () {
      should(tmpdir.path).not.be.a.realpath();
      done();
    });
  });

  it('tmpdir.mkdirSync({recursive: true})', function () {
    var tmpdir = ts.mkdirSync({recursive: true});
    tmpdir != null && gc(tmpdir.path, true, true);
    should(tmpdir).be.a.tmpdir();
    var subdir = ts.mkdirSync({dir: tmpdir.path});
    subdir != null && gc(subdir.path, true, true);
    should(subdir).be.a.tmpdir();
    tmpdir.unlink();
    should(tmpdir.path).not.be.a.realpath();
    should(subdir.path).not.be.a.realpath();
  });

});
