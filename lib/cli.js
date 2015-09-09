#!/usr/bin/env node
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _minimist = require('minimist');

var _minimist2 = _interopRequireDefault(_minimist);

var _download = require('./download');

var _download2 = _interopRequireDefault(_download);

var _read = require('./read');

var _read2 = _interopRequireDefault(_read);

var debug = require('./util/debug')('cli');
var args = (0, _minimist2['default'])(process.argv.slice(2), {
  boolean: ['refresh', 'full', 'read'],
  string: ['dir', 'client', 'secret', 'user']
});

debug(args);

if (args.read) {
  (0, _read2['default'])(args, function (err, result) {
    if (err) {
      throw err;
    } else {
      process.stdout.write(JSON.stringify(result));
    }
  });
} else {
  (0, _download2['default'])(args, function (err, result) {
    if (err) {
      throw err;
    } else if (!process.env.DEBUG) {
      process.stdout.write('Done');
    }
  });
}