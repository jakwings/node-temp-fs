# temp-fs

[![Build Status](https://travis-ci.org/jakwings/node-temp-fs.svg)](https://travis-ci.org/jakwings/node-temp-fs)
[![NPM version](https://badge.fury.io/js/temp-fs.svg)](http://badge.fury.io/js/temp-fs)

A temporary file and directory creator for io.js and Node.js™.

Just like raszi/node-tmp and bruce/node-temp, it can safely create temporary
files and directories without worrying a lot of about race conditions as long
as you don't do some tricky things. ;-) You can also let this module track the
files or directories you created and delete them when the program exits.


## Installation

```bash
npm install temp-fs
```

```javascript
var tempfs = require('temp-fs');

// Create a tempfile in the system-provided tempdir.
ts.open(function (err, file) {
    if (err) {
        throw err;
    }
    console.log(file.path, file.fd);
    // async
    file.unlink(function () {
        console.log('File delected');
    });
    // sync
    // No problem even if unlink() is called twice.
    file.unlink();
});
```


## APIs

### options

*   `limit: Number`

    The maximum number of chance to retry before throwing an error. Default: 5

*   `recursive: Boolean`

    Whether `unlink()` should remove a directory recursively. Default: false

*   `track: Boolean`

    If set to `true`, let tempfs manage the the current file/directory for
    you. If set to `false`, don't let tempfs manage it. Otherwise, use the
    current global setting.

*   `mode: Number`

    File mode (default: 0600) or directory mode (default: 0700) to use.

*   `name: String`

    If set, join the two paths `options.dir || tempfs.tmpdir()` and
    `options.name` together and use the result as the custom
    filename/pathname.

*   `dir: String`

    See `options.name` above. Default: tempfs.tmpdir()

*   `prefix: String`

    The prefix for the generated random name. Default: "tmp-"

*   `suffix: String`

    The suffix for the generated random name. Default: ""

*   `template: String`

    A string containing some capital letters Xs for substitution with random
    characters. Then it is used as part of the filename/dirname.


### tempfs.track(on = true)

Use it to switch global files/directories tracking on or off. Turn it on if
you don't want to manually delete everything. When it is turned off, all
recorded files and directories will not be removed but still kept in case it
is turned on again before the program exits.

### tempfs.dir()

Return the path of a system-provided tempdir.

### tempfs.name([options])

Return a custom/random filename/dirname. Options are documented at
[options](#options).

### tempfs.open([options], [callback])

Try to open a unique tempfile asynchronously. The callback function receives
two arguments `error` and `file`. If `error` is null, `file` has these
properties:

*   `path`: The absolute path to the tempfile.
*   `fd`: An integer file descriptor.
*   `unlink`: A special function for you to delete the file. If you invoke it
    with a callback function, it will become asynchronous.

### tempfs.openSync([options]): file

The synchronous version of `tempfs.open`.

### tempfs.mkdir([options], [callback])

Try to create a new tempdir asynchronously. The callback function receives two
arguments `error` and `dir`. If `error` is null, `dir` has these properties:

*   `path`: The absolute path to the tempdir.
*   `recursive`: Whether unlink() will remove the tempdir recursively.
*   `unlink`: A special function for you to remove the directory. If you
    invoke it with a callback function, it will become asynchronous.

### tempfs.mkdirSync([options]): dir

The synchronous version of `tempfs.mkdir`.

### tempfs.clear([callback])

Remove all tracked files and directories asynchronously.

### tempfs.clearSync()

Remove all tracked files and directories synchronously.


## License

The MIT License (MIT)

Copyright (c) 2015 Jak Wings

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
