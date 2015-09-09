'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _utilRequiredOptions = require('./util/requiredOptions');

var _utilRequiredOptions2 = _interopRequireDefault(_utilRequiredOptions);

var _utilReadJsonDir = require('./util/readJsonDir');

var _utilReadJsonDir2 = _interopRequireDefault(_utilReadJsonDir);

var _utilConstants = require('./util/constants');

var debug = require('./util/debug')('read');

exports['default'] = function (options, cb) {
  var _requiredOptions = (0, _utilRequiredOptions2['default'])(options, ['dir', 'user']);

  var dir = _requiredOptions.dir;
  var user = _requiredOptions.user;

  var userDir = _path2['default'].join(dir, user, _utilConstants.JSON_DIRNAME);
  debug('Reading directory ' + userDir);

  (0, _utilReadJsonDir2['default'])({ dir: userDir, comparator: function comparator(item) {
      return Number(item.created_time) * -1;
    } }, cb);
};

module.exports = exports['default'];