var fs = require('fs');
var ps = require('path');
var ts = require(ps.join(__dirname, '..'));
var should = require('should').noConflict();
require('./utils/assertion')(should);


describe('tempfs.dir()', function () {

  it('should return a valid default tmpdir for every test', function () {
    var path = ts.dir();
    should(path).be.a.dirpath;
  });

});
