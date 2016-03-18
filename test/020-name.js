var fs = require('fs');
var ps = require('path');
var ts = require(ps.join(__dirname, '..'));
var should = require('should').noConflict();
require('./utils/assertion')(should);


describe('tempfs.name()', function () {

  it('should return a random name relative to default tmpdir', function () {
    var name = ts.name();
    should(name).be.a.String();
    var basename = ps.basename(name);
    should(basename).startWith('tmp-');
    should(name).equal(ps.join(ts.dir(), basename));
  });

  it('tempfs.name({name})', function () {
    var name = ts.name({name: 'XXXXXX'});
    should(name).be.a.String();
    var basename = ps.basename(name);
    should(basename).equal('XXXXXX');
    should(name).equal(ps.join(ts.dir(), basename));
  });

  it('tempfs.name({template})', function () {
    var name = ts.name({template: 'XXXXXX'});
    should(name).be.a.String();
    var basename = ps.basename(name);
    should(basename.length === 6).be.true();
    should(name).equal(ps.join(ts.dir(), basename));
  });

  it('tempfs.name({dir})', function () {
    var name = ts.name({dir: __dirname});
    should(name).be.a.String();
    should(name).equal(ps.join(__dirname, ps.basename(name)));
  });

  it('tempfs.name({prefix})', function () {
    var name = ts.name({prefix: 'temp-'});
    should(name).be.a.String();
    var basename = ps.basename(name);
    should(basename).startWith('temp-');
    should(name).equal(ps.join(ts.dir(), basename));
  });

  it('tempfs.name({suffix})', function () {
    var name = ts.name({suffix: '-tmp'});
    should(name).be.a.String();
    var basename = ps.basename(name);
    should(basename).endWith('-tmp');
    should(name).equal(ps.join(ts.dir(), basename));
  });

});
