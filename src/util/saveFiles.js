import fs from 'fs'
import mkdirp from 'mkdirp'
import each from 'lodash/each'
import partial from 'lodash/partial'
import some from 'lodash/some'
import reject from 'lodash/reject'
import assign from 'lodash/assign'
import once from 'lodash/once'
import {parallel} from 'async'
import request from 'request'
import urlUtils from 'url'
import debug from './debug'
import urlToPath from './urlToPath'

const debugApi = debug('api')
const debugJson = debug('json')
const debugMedia = debug('media')

const stripUrlParts = (url, ...rejects) => {
  const rejector = (part) => some(rejects, (r) => part.match(r))
  const parsed = urlUtils.parse(url)
  const newUrl = urlUtils.format(assign(parsed, {
    pathname: reject(parsed.pathname.split('/'), rejector).join('/')
  }))
  return url !== newUrl ? newUrl : null
}

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
        debugJson(`${id} likes count:${json.likes.count} data:${likes.length}`)
        debugJson(`${id} comments count:${json.comments.count} data:${comments.length}`)
        writeFile(json)
      })
    } else {
      writeFile(json)
    }
  })
}

export const saveMedia = ({mediaDir}) => (url, saveDone) => {
  // Make sure callback is always called once since we need both error and close events
  // https://github.com/caolan/async/issues/614#issuecomment-55045730
  const saveDoneOnce = once(saveDone)

  // The Instagram media files get saved to a location on disk that matches the
  // urls domain+path, so we need to make that directory and then save the file
  const {filepath, dirname} = urlToPath({mediaDir, url})

  // An Instagram media at a url should never change so we shouldn't ever
  // need to download it more than once
  const writeIfNeeded = partial(shouldWrite, {debug: debugMedia, filepath, overwrite: false}, saveDoneOnce)

  writeIfNeeded(() => {
    mkdirp(dirname, (err) => {
      if (err) {
        debugMedia(`Error creating dir ${dirname}: ${err}`)
        return saveDoneOnce(err)
      }
      request(url)
      .on('error', (err) => {
        debugMedia(`Error fetching media ${url}: ${err}`)
        saveDoneOnce(err)
      })
      .pipe(fs.createWriteStream(filepath))
      .on('close', saveDoneOnce)
    })
  })
}

export const fetchAndSave = ({jsonQueue, mediaQueue}, cb) => {
  let COUNT = 0

  // The callback passed to the function will be executed once
  // both json and media queues have been drained
  const onDrain = () => {
    if (mediaQueue.running() === 0 && jsonQueue.running() === 0) {
      cb()
    }
  }

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
      debugApi(`API error ${err}`)
      if (err.error_type === 'APINotAllowedError' || err.error_type === 'APINotFoundError') {
        debugApi('Its possible the user\'s account you are trying to download is private')
        debugApi('If you are running your Instagram client in Sandbox mode, make sure the user is added as a Sandbox user')
      }
    } else if (medias && medias.length) {
      COUNT += medias.length
      debugApi(`Fetched media ${medias.length}`)
      debugApi(`Fetched total ${COUNT}`)
      medias.forEach((media) => {
        // Special stuff for https://github.com/lukekarrys/instagram-download/issues/3
        if (media.images) {
          const {thumbnail, standard_resolution: standardResolution} = media.images
          if (thumbnail) {
            // high res uncropped
            // remove s150x150 and c0.134.1080.1080 from
            // t51.2885-15/s150x150/e35/c0.134.1080.1080/12725175_958336534244864_1369827234_n.jpg
            const highRes = stripUrlParts(thumbnail.url, /^s\d+x\d+$/, /^c\d+\.\d+\.\d+\.\d+$/)
            if (highRes) media.images.high_resolution = { url: highRes }
          }
          // high res cropped
          // remove s640x640 from
          // t51.2885-15/s640x640/sh0.08/e35/12502019_964211777003492_661892888_n.jpg
          if (standardResolution) {
            const highResCropped = stripUrlParts(standardResolution.url, /^s\d+x\d+$/)
            if (highResCropped) media.images.high_resolution_cropped = { url: highResCropped }
          }
        }
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
