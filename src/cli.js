#!/usr/bin/env node

import minimist from 'minimist'
import download from './download'
import read from './read'
import doctor from './doctor'
import token from './token'

const exit = (err) => process.exit(err ? 1 : 0)
const debug = require('./util/debug')('cli')
const args = minimist(process.argv.slice(2), {
  boolean: ['refresh', 'full', 'read', 'doctor', 'get_token'],
  string: ['dir', 'token', 'user', 'client', 'secret']
})

debug(args)

if (args.doctor) {
  doctor(args, (err, result) => {
    if (err) {
      throw err
    } else {
      console.log(JSON.stringify(result, null, 2))
    }
  })
} else if (args.read) {
  read(args, (err, result) => {
    if (err) {
      throw err
    } else {
      console.log(JSON.stringify(result))
    }
  })
} else if (args.get_token) {
  token(args)
    .then(
      (res) => {
        console.log(res)
        exit()
      },
      (err) => {
        console.log(err)
        exit(err)
      }
    )
} else {
  download(args, (err, result) => {
    if (err) {
      throw err
    } else if (!process.env.DEBUG) {
      console.log('Done')
    }
  })
}
