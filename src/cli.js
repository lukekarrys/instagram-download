#!/usr/bin/env node

import minimist from 'minimist'
import download from './download'
import read from './read'

const debug = require('./util/debug')('cli')
const args = minimist(process.argv.slice(2), {
  boolean: ['refresh', 'full', 'read'],
  string: ['dir', 'client', 'secret', 'user']
})

debug(args)

if (args.read) {
  read(args, (err, result) => {
    if (err) {
      throw err
    } else {
      process.stdout.write(JSON.stringify(result))
    }
  })
} else {
  download(args, (err, result) => {
    if (err) {
      throw err
    } else if (!process.env.DEBUG) {
      process.stdout.write('Done')
    }
  })
}
