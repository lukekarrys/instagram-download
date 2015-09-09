'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodashObjectKeys = require('lodash/object/keys');

var _lodashObjectKeys2 = _interopRequireDefault(_lodashObjectKeys);

var _lodashCollectionSome = require('lodash/collection/some');

var _lodashCollectionSome2 = _interopRequireDefault(_lodashCollectionSome);

var _lodashCollectionIncludes = require('lodash/collection/includes');

var _lodashCollectionIncludes2 = _interopRequireDefault(_lodashCollectionIncludes);

var debug = require('./debug')('options');

exports['default'] = function (options, required) {
  var optKeys = (0, _lodashObjectKeys2['default'])(options);
  optKeys.forEach(function (key) {
    return debug('OPT ' + key + ' ' + options[key]);
  });

  if ((0, _lodashCollectionSome2['default'])(required || [], function (key) {
    return !(0, _lodashCollectionIncludes2['default'])(optKeys, key);
  })) {
    throw new Error(required.join(', ') + ' options are required');
  }

  return options;
};

module.exports = exports['default'];