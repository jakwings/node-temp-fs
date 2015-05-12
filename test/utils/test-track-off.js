var ps = require('path');
var ts = require(ps.join(__dirname, '..', '..'));


ts.track(false);

var playground = ps.join(__dirname, '..', 'playground');
var tmpfile = ts.openSync({dir: playground, track: true});
process.send(tmpfile);
