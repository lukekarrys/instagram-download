'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _lodashFunctionAfter = require('lodash/function/after');

var _lodashFunctionAfter2 = _interopRequireDefault(_lodashFunctionAfter);

var _async = require('async');

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _lodashCollectionEach = require('lodash/collection/each');

var _lodashCollectionEach2 = _interopRequireDefault(_lodashCollectionEach);

var _debug = require('./debug');

var _debug2 = _interopRequireDefault(_debug);

var debugApi = (0, _debug2['default'])('api');
var debugJson = (0, _debug2['default'])('json');
var debugImage = (0, _debug2['default'])('image');

var shouldWrite = function shouldWrite(debug, filepath, overwrite, yes, no) {
  _fs2['default'].exists(filepath, function (exists) {
    if (exists && !overwrite) {
      debug('Exists, skipping ' + filepath);
      no();
    } else if (exists && overwrite) {
      debug('Exists, overwriting ' + filepath);
      yes();
    } else {
      debug('Does not exist, writing ' + filepath);
      yes();
    }
  });
};

var saveJson = function saveJson(_ref) {
  var ig = _ref.ig;
  var jsonDir = _ref.jsonDir;
  var refresh = _ref.refresh;
  var full = _ref.full;
  return function (json, saveDone) {
    var id = json.id;
    var filepath = jsonDir(id + '.json');
    var writeFile = function writeFile(data) {
      return _fs2['default'].writeFile(filepath, JSON.stringify(data), { encoding: 'utf8' }, saveDone);
    };
    shouldWrite(debugJson, filepath, refresh, function () {
      if (full) {
        // Full means we fetch likes and comments separately and add those
        // to the json payload that gets saved
        (0, _async.parallel)({
          likes: function likes(cb) {
            return ig.likes(id, cb);
          },
          comments: function comments(cb) {
            return ig.comments(id, cb);
          }
        }, function (err, res) {
          if (err) return saveDone(err);
          json.likes.data = res.likes;
          json.comments.data = res.comments;
          writeFile(json);
        });
      } else {
        writeFile(json);
      }
    }, saveDone);
  };
};

exports.saveJson = saveJson;
var saveImage = function saveImage(_ref2) {
  var mediaDir = _ref2.mediaDir;
  return function (url, cb) {
    // The Instagram images get saved to a location on disk that matches the
    // urls domain+path, so we need to make that directory and then save the file
    var stripped = url.replace(/^https?:\/\//, '/');
    var dirname = mediaDir(_path2['default'].dirname(stripped));
    var filepath = _path2['default'].join(dirname, _path2['default'].basename(stripped));
    // An Instagram image at a url should never change so we shouldn't ever
    // need to download it more than once
    shouldWrite(debugImage, filepath, false, function () {
      (0, _mkdirp2['default'])(dirname, function (err) {
        if (err) return cb(err);
        (0, _request2['default'])(url).pipe(_fs2['default'].createWriteStream(filepath)).on('close', cb);
      });
    }, cb);
  };
};

exports.saveImage = saveImage;
var fetchAndSave = function fetchAndSave(_ref3, cb) {
  var jsonQueue = _ref3.jsonQueue;
  var imageQueue = _ref3.imageQueue;

  var COUNT = 0;

  // The callback passed to the function will be executed once
  // both json and image queues have been drained
  var onDrain = (0, _lodashFunctionAfter2['default'])(2, cb);
  jsonQueue.drain = function () {
    debugJson('queue drain');
    onDrain();
  };
  imageQueue.drain = function () {
    debugImage('queue drain');
    onDrain();
  };

  var fetchMedia = function fetchMedia(err, medias, pagination, remaining) {
    debugApi('API calls left ' + remaining);
    debugApi('Has next page ' + !!pagination.next);

    if (err) {
      debugApi('API error ' + err);
    } else if (medias && medias.length) {
      COUNT += medias.length;
      debugApi('Fetched media ' + medias.length);
      debugApi('Fetched total ' + COUNT);

      medias.forEach(function (media) {
        jsonQueue.push(media);
        (0, _lodashCollectionEach2['default'])(media.images, function (img) {
          return imageQueue.push(img.url);
        });
      });
    } else if (medias.length === 0 && COUNT === 0 && !pagination.next) {
      debugApi('No media');
      cb();
    }

    pagination.next && pagination.next(fetchMedia);
  };
  return fetchMedia;
};
exports.fetchAndSave = fetchAndSave;