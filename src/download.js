import path from 'path'

import {instagram} from 'instagram-node'
import {queue, series} from 'async'
import mkdirp from 'mkdirp'
import partial from 'lodash/function/partial'
import requiredOptions from './util/requiredOptions'
import {saveMedia, saveJson, fetchAndSave} from './util/saveFiles'
import {MAX_COUNT, QUEUE_CONCURRENCY, JSON_DIRNAME, MEDIA_DIRNAME} from './util/constants'
import readIGData from './read'

const debug = require('./util/debug')('download')

export default (options, cb) => {
  const {dir, client, secret, user, refresh, full} = requiredOptions(options, ['dir', 'client', 'secret', 'user'])

  // Directories for saving files
  const userDir = partial(path.join, dir, user)
  const jsonDir = partial(userDir, JSON_DIRNAME)
  const mediaDir = partial(userDir, MEDIA_DIRNAME)
  debug(`User dir ${userDir()}`)
  debug(`Json dir ${jsonDir()}`)
  debug(`Media dir ${mediaDir()}`)

  // Configure our instagram API instance
  const ig = instagram()
  ig.use({client_id: client, client_secret: secret})

  // Make sure all our directories are created and
  // then start the instagram fetching
  series({
    json: (cb) => mkdirp(jsonDir(), cb),
    media: (cb) => mkdirp(mediaDir(), cb),
    data: (cb) => readIGData({dir: dir, user: user}, cb)
  }, (err, results) => {
    if (err) return cb(err)

    const igOptions = {count: MAX_COUNT}
    const {data: [first]} = results

    // This is our most recent instagram photo so we use it as a min_id
    // to only fetch photos newer than this
    if (first && first.created_time && !refresh) {
      igOptions.min_timestamp = Number(first.created_time) + 1
      debug(`Fetching since ${first.id} ${new Date(Number(first.created_time) * 1000).toJSON()}`)
    }

    const queueOptions = {ig, jsonDir, mediaDir, refresh, full}
    const jsonQueue = queue(saveJson(queueOptions), QUEUE_CONCURRENCY)
    const mediaQueue = queue(saveMedia(queueOptions), QUEUE_CONCURRENCY)

    // Fetch the first page of most recent media
    // The fetchAndSave callback will take care of iterating over each page
    ig.user_media_recent(user, igOptions, fetchAndSave({jsonQueue, mediaQueue}, cb))
  })
}
