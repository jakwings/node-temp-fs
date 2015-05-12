var fs = require('fs');


module.exports = function (should) {
  should.use(function (should, Assertion) {

    Assertion.add('realpath', function () {
      this.params = { operator: 'to be a real path' };
      var path = this.obj;
      should(path).be.a.String;
      should(function () {
        fs.realpathSync(path);
      }).not.throw();
    }, true);

    Assertion.add('dirpath', function () {
      this.params = { operator: 'to be a directory path' };
      var path = this.obj;
      should(path).be.a.realpath;
      var stats = fs.statSync(path);
      should(stats.isDirectory()).be.true;
    }, true);

    Assertion.add('filepath', function () {
      this.params = { operator: 'to be a file path' };
      var path = this.obj;
      should(path).be.a.realpath;
      var stats = fs.statSync(path);
      should(stats.isFile()).be.true;
    }, true);

    Assertion.add('tmpdir', function () {
      this.params = { operator: 'to be a tmpdir' };
      var tmpdir = this.obj;
      should(tmpdir).be.an.Object.which.has.keys('path', 'recursive', 'unlink');
      should(tmpdir.path).be.a.dirpath;
      should(tmpdir.recursive).be.a.Boolean;
      should(tmpdir.unlink).be.a.Function;
    }, true);

    Assertion.add('tmpfile', function () {
      this.params = { operator: 'to be a tmpfile' };
      var tmpfile = this.obj;
      should(tmpfile).be.an.Object.which.has.keys('path', 'fd', 'unlink');
      should(tmpfile.path).be.a.filepath;
      should(tmpfile.fd).be.a.Number;
      should(tmpfile.unlink).be.a.Function;
    }, true);

  });
};
