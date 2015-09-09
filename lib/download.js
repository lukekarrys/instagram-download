'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _instagramNode = require('instagram-node');

var _async = require('async');

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _lodashFunctionPartial = require('lodash/function/partial');

var _lodashFunctionPartial2 = _interopRequireDefault(_lodashFunctionPartial);

var _utilRequiredOptions = require('./util/requiredOptions');

var _utilRequiredOptions2 = _interopRequireDefault(_utilRequiredOptions);

var _utilSaveFiles = require('./util/saveFiles');

var _utilConstants = require('./util/constants');

var _read = require('./read');

var _read2 = _interopRequireDefault(_read);

var debug = require('./util/debug')('download');

exports['default'] = function (options, cb) {
  var _requiredOptions = (0, _utilRequiredOptions2['default'])(options, ['dir', 'client', 'secret', 'user']);

  var dir = _requiredOptions.dir;
  var client = _requiredOptions.client;
  var secret = _requiredOptions.secret;
  var user = _requiredOptions.user;
  var refresh = _requiredOptions.refresh;
  var full = _requiredOptions.full;

  // Directories for saving files
  var userDir = (0, _lodashFunctionPartial2['default'])(_path2['default'].join, dir, user);
  var jsonDir = (0, _lodashFunctionPartial2['default'])(userDir, _utilConstants.JSON_DIRNAME);
  var mediaDir = (0, _lodashFunctionPartial2['default'])(userDir, _utilConstants.MEDIA_DIRNAME);
  debug('User dir ' + userDir());
  debug('Json dir ' + jsonDir());
  debug('Media dir ' + mediaDir());

  // Configure our instagram API instance
  var ig = (0, _instagramNode.instagram)();
  ig.use({ client_id: client, client_secret: secret });

  // Make sure all our directories are created and
  // then start the instagram fetching
  (0, _async.series)({
    json: function json(cb) {
      return (0, _mkdirp2['default'])(jsonDir(), cb);
    },
    media: function media(cb) {
      return (0, _mkdirp2['default'])(mediaDir(), cb);
    },
    data: function data(cb) {
      return (0, _read2['default'])({ dir: dir, user: user }, cb);
    }
  }, function (err, results) {
    if (err) return cb(err);

    var igOptions = { count: _utilConstants.MAX_COUNT };

    var _results$data = _slicedToArray(results.data, 1);

    var first = _results$data[0];

    // This is our most recent instagram photo so we use it as a min_id
    // to only fetch photos newer than this
    if (first && first.created_time && !refresh) {
      igOptions.min_timestamp = Number(first.created_time) + 1;
      debug('Fetching since ' + first.id + ' ' + new Date(Number(first.created_time) * 1000).toJSON());
    }

    var queueOptions = { ig: ig, jsonDir: jsonDir, mediaDir: mediaDir, refresh: refresh, full: full };
    var jsonQueue = (0, _async.queue)((0, _utilSaveFiles.saveJson)(queueOptions), _utilConstants.QUEUE_CONCURRENCY);
    var mediaQueue = (0, _async.queue)((0, _utilSaveFiles.saveMedia)(queueOptions), _utilConstants.QUEUE_CONCURRENCY);

    // Fetch the first page of most recent media
    // The fetchAndSave callback will take care of iterating over each page
    ig.user_media_recent(user, igOptions, (0, _utilSaveFiles.fetchAndSave)({ jsonQueue: jsonQueue, mediaQueue: mediaQueue }, cb));
  });
};

module.exports = exports['default'];