var ps = require('path');
var ts = require(ps.join(__dirname, '..', '..'));
var should = require('should').noConflict();
require('./assertion')(should);


ts.track(false);

var playground = ps.join(__dirname, '..', 'playground');
var tmpfile = ts.openSync({dir: playground, track: true});
should(tmpfile).be.a.tmpfile();
process.send(tmpfile);
process.exit(0);
