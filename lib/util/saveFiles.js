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

var _lodashCollectionEach = require('lodash/collection/each');

var _lodashCollectionEach2 = _interopRequireDefault(_lodashCollectionEach);

var _lodashFunctionPartial = require('lodash/function/partial');

var _lodashFunctionPartial2 = _interopRequireDefault(_lodashFunctionPartial);

var _async = require('async');

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _debug = require('./debug');

var _debug2 = _interopRequireDefault(_debug);

var debugApi = (0, _debug2['default'])('api');
var debugJson = (0, _debug2['default'])('json');
var debugMedia = (0, _debug2['default'])('media');

var shouldWrite = function shouldWrite(_ref, no, yes) {
  var debug = _ref.debug;
  var filepath = _ref.filepath;
  var overwrite = _ref.overwrite;

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

var saveJson = function saveJson(_ref2) {
  var ig = _ref2.ig;
  var jsonDir = _ref2.jsonDir;
  var refresh = _ref2.refresh;
  var full = _ref2.full;
  return function (json, saveDone) {
    var id = json.id;
    var filepath = jsonDir(id + '.json');

    var writeIfNeeded = (0, _lodashFunctionPartial2['default'])(shouldWrite, { debug: debugJson, filepath: filepath, overwrite: refresh }, saveDone);
    var writeFile = function writeFile(data) {
      return _fs2['default'].writeFile(filepath, JSON.stringify(data), { encoding: 'utf8' }, saveDone);
    };

    var fetchForPost = function fetchForPost(fetch) {
      return function (cb) {
        return ig[fetch](id, function (err, res, remaining) {
          debugApi('API calls left ' + remaining);
          if (err) {
            debugApi(fetch + ' API error ' + err);
            return cb(err);
          }
          debugJson(id + ' ' + fetch + ' ' + res.length);
          cb(null, res);
        });
      };
    };

    writeIfNeeded(function () {
      if (full) {
        // Full means we fetch likes and comments separately and add those
        // to the json payload that gets saved
        (0, _async.parallel)({
          likes: fetchForPost('likes'),
          comments: fetchForPost('comments')
        }, function (err, _ref3) {
          var likes = _ref3.likes;
          var comments = _ref3.comments;

          if (err) return saveDone(err);
          json.likes.data = likes;
          json.comments.data = comments;
          writeFile(json);
        });
      } else {
        writeFile(json);
      }
    });
  };
};

exports.saveJson = saveJson;
var saveMedia = function saveMedia(_ref4) {
  var mediaDir = _ref4.mediaDir;
  return function (url, saveDone) {
    // The Instagram media files get saved to a location on disk that matches the
    // urls domain+path, so we need to make that directory and then save the file
    var stripped = url.replace(/^https?:\/\//, '/');
    var dirname = mediaDir(_path2['default'].dirname(stripped));
    var filepath = _path2['default'].join(dirname, _path2['default'].basename(stripped));

    // An Instagram media at a url should never change so we shouldn't ever
    // need to download it more than once
    var writeIfNeeded = (0, _lodashFunctionPartial2['default'])(shouldWrite, { debug: debugMedia, filepath: filepath, overwrite: false }, saveDone);

    writeIfNeeded(function () {
      (0, _mkdirp2['default'])(dirname, function (err) {
        if (err) return saveDone(err);
        (0, _request2['default'])(url).pipe(_fs2['default'].createWriteStream(filepath)).on('close', saveDone);
      });
    });
  };
};

exports.saveMedia = saveMedia;
var fetchAndSave = function fetchAndSave(_ref5, cb) {
  var jsonQueue = _ref5.jsonQueue;
  var mediaQueue = _ref5.mediaQueue;

  var COUNT = 0;

  // The callback passed to the function will be executed once
  // both json and media queues have been drained
  var onDrain = (0, _lodashFunctionAfter2['default'])(2, cb);
  jsonQueue.drain = function () {
    debugJson('queue drain');
    onDrain();
  };
  mediaQueue.drain = function () {
    debugMedia('queue drain');
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
          return mediaQueue.push(img.url);
        });
        (0, _lodashCollectionEach2['default'])(media.videos, function (video) {
          return mediaQueue.push(video.url);
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