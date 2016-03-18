var ps = require('path');
var ts = require(ps.join(__dirname, '..', '..'));
var should = require('should').noConflict();
require('./assertion')(should);


var playground = ps.join(__dirname, '..', 'playground');
for (var i = 0; i < 5; i++) {
  var tmpdir = ts.mkdirSync({dir: playground, track: true});
  should(tmpdir).be.a.tmpdir();
  process.send(tmpdir);
}
for (var i = 0; i < 5; i++) {
  var tmpfile = ts.openSync({dir: playground, track: true});
  should(tmpfile).be.a.tmpfile();
  process.send(tmpfile);
}
throw new Error('Uncaught Exception');
