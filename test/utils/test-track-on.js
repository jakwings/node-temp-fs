var ps = require('path');
var ts = require(ps.join(__dirname, '..', '..'));
var should = require('should').noConflict();
require('./assertion')(should);


ts.track();

var playground = ps.join(__dirname, '..', 'playground');
var tmpfile = ts.openSync({dir: playground});
should(tmpfile).be.a.tmpfile;
process.send(tmpfile);
process.exit(0);
