import fs from 'fs'
import async from 'async'
import path from 'path'
import sortBy from 'lodash/sortBy'
import attempt from 'lodash/attempt'
import isError from 'lodash/isError'

const isJSON = (filename) => path.extname(filename) === '.json'
const readFile = (file, cb) => fs.readFile(file, {encoding: 'utf8'}, cb)

const readJson = (file, cb) => readFile(file, (err, data) => {
  if (err) return cb(err)
  const result = attempt(() => JSON.parse(data))
  cb(isError(result) ? result : null, isError(result) ? null : result)
})

export default ({dir, comparator}, cb) => {
  fs.readdir(dir, (dirErr, files) => {
    if (dirErr) return cb(dirErr)

    async.map(
      files.filter(isJSON),
      (file, fileCb) => readJson(path.join(dir, file), fileCb),
      (err, results) => {
        if (err) return cb(err)
        cb(null, sortBy(results, comparator))
      }
    )
  })
}
