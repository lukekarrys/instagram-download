'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _download = require('./download');

var _download2 = _interopRequireDefault(_download);

var _read = require('./read');

var _read2 = _interopRequireDefault(_read);

exports.read = _read2['default'];
exports['default'] = _download2['default'];