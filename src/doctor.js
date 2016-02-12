
import fs from 'fs'
import path from 'path'
import read from './read'
import {map as aMap, parallel} from 'async'
import last from 'lodash/array/last'
import partial from 'lodash/function/partial'
import assign from 'lodash/object/assign'
import transform from 'lodash/object/transform'
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
    stats.missing =
    cb(null, assign({}, stats, ...results))
  })
})
