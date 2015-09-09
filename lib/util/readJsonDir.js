'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodashCollectionSortBy = require('lodash/collection/sortBy');

var _lodashCollectionSortBy2 = _interopRequireDefault(_lodashCollectionSortBy);

var _lodashUtilityAttempt = require('lodash/utility/attempt');

var _lodashUtilityAttempt2 = _interopRequireDefault(_lodashUtilityAttempt);

var _lodashLangIsError = require('lodash/lang/isError');

var _lodashLangIsError2 = _interopRequireDefault(_lodashLangIsError);

var isJSON = function isJSON(filename) {
  return _path2['default'].extname(filename) === '.json';
};
var readFile = function readFile(file, cb) {
  return _fs2['default'].readFile(file, { encoding: 'utf8' }, cb);
};

var readJson = function readJson(file, cb) {
  return readFile(file, function (err, data) {
    if (err) return cb(err);
    var result = (0, _lodashUtilityAttempt2['default'])(function () {
      return JSON.parse(data);
    });
    cb((0, _lodashLangIsError2['default'])(result) ? result : null, (0, _lodashLangIsError2['default'])(result) ? null : result);
  });
};

exports['default'] = function (_ref, cb) {
  var dir = _ref.dir;
  var comparator = _ref.comparator;

  _fs2['default'].readdir(dir, function (dirErr, files) {
    if (dirErr) return cb(dirErr);

    _async2['default'].map(files.filter(isJSON), function (file, fileCb) {
      return readJson(_path2['default'].join(dir, file), fileCb);
    }, function (err, results) {
      if (err) return cb(err);
      cb(null, (0, _lodashCollectionSortBy2['default'])(results, comparator));
    });
  });
};

module.exports = exports['default'];