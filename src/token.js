'use strict'

import express from 'express'
import {instagram} from 'instagram-node'
import open from 'open'

const AUTH_URL = 'auth'
const DEFAULT_SCOPE = ['basic', 'public_content']
const DEFAULT_PORT = 3003

export default ({client, secret, scope = DEFAULT_SCOPE, port = DEFAULT_PORT}) => {
  if (!client || !secret) {
    throw new Error('client and secret options are required')
  }

  if (typeof scope === 'string') {
    scope = scope.split(',')
  }

  return new Promise((resolve, reject) => {
    const app = express()
    const api = instagram()
    const redirect = `http://localhost:${port}/`
    let server = null

    api.use({client_id: client, client_secret: secret})

    // This is where you would initially send users to authorize
    app.get(`/${AUTH_URL}`, (req, res) => {
      res.redirect(api.get_authorization_url(redirect, {scope}))
    })

    // This is your redirect URI
    app.get('/', (req, res) => {
      api.authorize_user(req.query.code, redirect, (err, result) => {
        if (err) {
          res.send(`There was an error: ${err}`)
          reject(new Error(err.body))
        } else {
          res.send(`Access token is <pre>${result.access_token}</pre>You can close this window and return to the CLI.`)
          resolve(result.access_token)
        }
        server.close()
      })
    })

    server = app.listen(port, () => open(`${redirect}${AUTH_URL}`))
  })
}
