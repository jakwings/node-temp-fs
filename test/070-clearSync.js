var ps = require('path');
var ts = require(ps.join(__dirname, '..'));
var gc = require('./utils/gc');
var should = require('should').noConflict();
require('./utils/assertion')(should);


describe('tempfs.clearSync()', function () {

  it('should clear all tracked files or directories in the default tmpdir', function () {
    var tmpdir = ts.mkdirSync({track: true});
    var tmpfile = ts.openSync({track: true});
    tmpdir != null && gc(tmpdir.path, true, true);
    tmpfile != null && gc(tmpdir.path, false, true);
    should(tmpdir).be.a.tmpdir();
    should(tmpfile).be.a.tmpfile();
    ts.clearSync();
    should(tmpdir.path).not.be.a.realpath();
    should(tmpfile.path).not.be.a.realpath();
  });

});
