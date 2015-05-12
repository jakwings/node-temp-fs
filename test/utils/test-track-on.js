var ps = require('path');
var ts = require(ps.join(__dirname, '..', '..'));


ts.track();

var playground = ps.join(__dirname, '..', 'playground');
var tmpfile = ts.openSync({dir: playground});
process.send(tmpfile);
