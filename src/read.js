import path from 'path'
import requiredOptions from './util/requiredOptions'
import readJsonDir from './util/readJsonDir'
import {JSON_DIRNAME} from './util/constants'

const debug = require('./util/debug')('read')

export default (options, cb) => {
  const {dir, user} = requiredOptions(options, ['dir', 'user'])

  const userDir = path.join(dir, user, JSON_DIRNAME)
  debug(`Reading directory ${userDir}`)

  readJsonDir({dir: userDir, comparator: (item) => Number(item.created_time) * -1}, cb)
}
