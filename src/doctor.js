import fs from 'fs'
import path from 'path'
import {map as aMap, parallel} from 'async'
import last from 'lodash/last'
import partial from 'lodash/partial'
import assign from 'lodash/assign'
import transform from 'lodash/transform'
import readDir from 'recursive-readdir'

import read from './read'
import requiredOptions from './util/requiredOptions'
import {MEDIA_DIRNAME} from './util/constants'
import urlToPath from './util/urlToPath'

const postDate = (post) => new Date(parseInt(post.created_time, 10) * 1000)

export default (options, cb) => read(options, (err, data) => {
  if (err) return cb(err)

  const {dir, user} = requiredOptions(options, ['dir', 'user'])
  const mediaDir = partial(path.join, path.resolve(__dirname, '..'), dir, user, MEDIA_DIRNAME)

  const mediaExists = (url, cb) => {
    fs.stat(urlToPath({mediaDir: mediaDir, url}).filepath, (err, file) => {
      if (err) {
        cb(null, false)
      } else {
        cb(null, file.isFile())
      }
    })
  }

  const mediaToTask = (prefix, item) => transform(item[prefix], (res, value, key) => {
    res[`${item.id}_${prefix}_${key}`] = (cb) => mediaExists(value.url, cb)
  })

  const stats = {
    length: data.length,
    first: postDate(data[0]),
    last: postDate(last(data))
  }

  aMap(data, (item, cb) => {
    parallel(assign(mediaToTask('images', item), mediaToTask('videos', item)), cb)
  }, (err, results) => {
    if (err) return cb(err)

    const hasMedia = transform(assign({}, ...results), (res, exists, key) => {
      if (exists) res.media++
      if (!exists) {
        res.missing++
        res.missingMedia.push(key)
      }
    }, {media: 0, missing: 0, missingMedia: []})

    readDir(
      mediaDir(),
      (err, files) => {
        if (err) return cb(err)
        cb(null, assign({fileCount: files.length}, stats, hasMedia))
      }
    )
  })
})
