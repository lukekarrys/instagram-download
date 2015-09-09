'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

exports['default'] = function (name) {
  return (0, _debug2['default'])('instagram-download:' + name);
};

module.exports = exports['default'];