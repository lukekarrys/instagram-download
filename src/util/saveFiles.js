import fs from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'
import after from 'lodash/function/after'
import each from 'lodash/collection/each'
import partial from 'lodash/function/partial'
import {parallel} from 'async'
import request from 'request'
import debug from './debug'

const debugApi = debug('api')
const debugJson = debug('json')
const debugMedia = debug('media')

const shouldWrite = ({debug, filepath, overwrite}, no, yes) => {
  fs.exists(filepath, (exists) => {
    if (exists && !overwrite) {
      debug(`Exists, skipping ${filepath}`)
      no()
    } else if (exists && overwrite) {
      debug(`Exists, overwriting ${filepath}`)
      yes()
    } else {
      debug(`Does not exist, writing ${filepath}`)
      yes()
    }
  })
}

export const saveJson = ({ig, jsonDir, refresh, full}) => (json, saveDone) => {
  const id = json.id
  const filepath = jsonDir(`${id}.json`)

  const writeIfNeeded = partial(shouldWrite, {debug: debugJson, filepath, overwrite: refresh}, saveDone)
  const writeFile = (data) => fs.writeFile(filepath, JSON.stringify(data), {encoding: 'utf8'}, saveDone)

  const fetchForPost = (fetch) => (cb) => ig[fetch](id, (err, res, remaining) => {
    debugApi(`API calls left ${remaining}`)
    if (err) {
      debugApi(`${fetch} API error ${err}`)
      return cb(err)
    }
    debugJson(`${id} ${fetch} ${res.length}`)
    cb(null, res)
  })

  writeIfNeeded(() => {
    if (full) {
      // Full means we fetch likes and comments separately and add those
      // to the json payload that gets saved
      parallel({
        likes: fetchForPost('likes'),
        comments: fetchForPost('comments')
      }, (err, {likes, comments}) => {
        if (err) return saveDone(err)
        json.likes.data = likes
        json.comments.data = comments
        writeFile(json)
      })
    } else {
      writeFile(json)
    }
  })
}

export const saveMedia = ({mediaDir}) => (url, saveDone) => {
  // The Instagram media files get saved to a location on disk that matches the
  // urls domain+path, so we need to make that directory and then save the file
  const stripped = url.replace(/^https?:\/\//, '/')
  const dirname = mediaDir(path.dirname(stripped))
  const filepath = path.join(dirname, path.basename(stripped))

  // An Instagram media at a url should never change so we shouldn't ever
  // need to download it more than once
  const writeIfNeeded = partial(shouldWrite, {debug: debugMedia, filepath, overwrite: false}, saveDone)

  writeIfNeeded(() => {
    mkdirp(dirname, (err) => {
      if (err) return saveDone(err)
      request(url).pipe(fs.createWriteStream(filepath)).on('close', saveDone)
    })
  })
}

export const fetchAndSave = ({jsonQueue, mediaQueue}, cb) => {
  let COUNT = 0

  // The callback passed to the function will be executed once
  // both json and media queues have been drained
  const onDrain = after(2, cb)
  jsonQueue.drain = () => {
    debugJson('queue drain')
    onDrain()
  }
  mediaQueue.drain = () => {
    debugMedia('queue drain')
    onDrain()
  }

  const fetchMedia = (err, medias, pagination, remaining) => {
    debugApi(`API calls left ${remaining}`)

    if (err) {
      console.log(err.error_type)
      if (err.error_type === 'APINotAllowedError') {
        debugApi(`Its possible the user's account you are trying to download is private`)
      }
      debugApi(`API error ${err}`)
    } else if (medias && medias.length) {
      COUNT += medias.length
      debugApi(`Fetched media ${medias.length}`)
      debugApi(`Fetched total ${COUNT}`)
      medias.forEach((media) => {
        jsonQueue.push(media)
        each(media.images, (img) => mediaQueue.push(img.url))
        each(media.videos, (video) => mediaQueue.push(video.url))
      })
    } else if (medias.length === 0 && COUNT === 0 && !pagination.next) {
      debugApi('No media')
      cb()
    }

    if (pagination) {
      debugApi(`Has next page ${!!pagination.next}`)
      pagination.next && pagination.next(fetchMedia)
    }
  }

  return fetchMedia
}
