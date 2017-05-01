instagram-download
===================

Download all the Instagram JSON data and media for a user.

[![NPM](https://nodei.co/npm/instagram-download.png)](https://nodei.co/npm/instagram-download/)
[![Build Status](https://travis-ci.org/lukekarrys/instagram-download.png?branch=master)](https://travis-ci.org/lukekarrys/instagram-download)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)
[![Greenkeeper badge](https://badges.greenkeeper.io/lukekarrys/instagram-download.svg)](https://greenkeeper.io/)

## API Restrictions as of June 1, 2016

**By default apps created for the Instagram API are in sandbox mode, and are only allowed to download the last 20 posts. They can also only access your user account and up to 9 other user accounts that accept your application request.**

## Install

`npm install instagram-download`

You may want to use the `--global` option when installing if you want to use the CLI globally on your machine.


## Usage

```js
import download, {read} from 'instagram-download'

// Download data for a user to a directory using an API access token
download({
  token,
  user,
  dir,
  refresh: true,  // Optional
  full: true      // Optional
}, (err) => console.log(err || 'Success'))

// Read previously downloaded data for a user from a directory
read({
  user,
  dir
}, (err, result) => console.log(err || result))
```


## CLI

All the same options are available to the CLI.

```sh
# Download data for a user to a directory using an API token
instagram-download --token=TOKEN --user=USER --dir=DIR [--refresh --full]

# Read previously downloaded data for a user from a directory
instagram-download --read --user=USER --dir=DIR
```


## API

### `options`

#### `user` (string, required)

The id of the Instagram user that you want to download.

#### `dir` (string, required)

The directory where you want to download all the data. It will be created if it does not exist. Inside the directory it will create a structure so that multiple users can be downloaded. See the [`media` and `json` section below](#media-and-json-directories) about how the data is stored inside those directories.

```sh
dir
├── USER1
│   ├── json
│   └── media
└── USER2
    ├── json
    └── media
```

#### `token` (string, required for `download`)

An access token for the Instagram API from your client application. If you don't have one you'll need to [create an app](https://instagram.com/developer/clients/manage/) and then [get an access token](#getting-an-access-token).

Note that as of June 1, 2016 API requests can no longer be made with using an application's client+secret (as this module did previously), and must use an access token.

#### `refresh` (boolean, optional, default `false`)

By default running `instagram-download` again will start after the most recent Instagram post that was downloaded previously, so that you can easily only fetch the latest Instagram data. Use the `refresh` option to overwrite all the existing Instagram data. Note that Instagram photos are never redownloaded because they should never change after being posted.

#### `full` (boolean, optional, default `false`)

By default the Instagram API only includes a few likes and comments with each post. You have the option (at the expense of two extra API requests per post) to fetch as many likes and comments as Instagram allows (which right now is ~120 each). You shouldn't hit any rate limits when using this option unless you have more than `2462` posts. See the [API Rate Limiting](#api-rate-limiting) section below for more detailed info about this.


## `images` sizes

The `images` hash in each json file will contain the following keys from Instagram `thumbnail`, `low_resolution`, and `standard_resolution`. The downloader will also [do some magic](https://github.com/lukekarrys/instagram-download/issues/3) to attempt to download the higher resolution versions (both cropped and uncropped) if possible, and those keys will be `high_resolution` and `high_resolution_cropped`.


## `media` and `json` directories

Once everything is downloaded you'll see the following directories: `$DIR/$USER_ID/json` and `$DIR/$USER_ID/media`. The `json` directory will consist of an `INSTAGRAM_POST_ID.json` file for each Instagram post. The `media` directory will consist of all the media (images and videos) with a directory structure that mirrors that pathnames from where they are hosted by Instagram. This is done so that if you look inside an `INSTAGRAM_POST_ID.json` file, you can easily find the images files by prefixing the url host + path with the path to the media directory for that user: `$DIR/$USER_ID/media`. Here's an example:

**_cache/1640745920/json/1002451038433600709_1640745920.json**
```json
{
  "id": "1002451038433600709_1640745920",
  "images": {
    "standard_resolution": {
      "url": "https://scontent.cdninstagram.com/hphotos-xfa1/t51.2885-15/e15/11312306_899995390069692_1338680988_n.jpg"
    }
  }
}
```

The standard resolution image for that post will be located at `_cache/1640745920/media/scontent.cdninstagram.com/hphotos-xfa1/t51.2885-15/e15/11312306_899995390069692_1338680988_n.jpg`. Here is some JS for how you'd go about getting that:

```js
import {statSync} from 'fs'
import {parse} from 'url'

const BASE = '_cache/1640745920/'
const JSON_DIR = 'json/'
const MEDIA_DIR = 'media/'
const POST_ID = '1002451038433600709_1640745920'

const post = require(`./${BASE}${JSON_DIR}${POST_ID}`)
const {host, path} = parse(post.images.standard_resolution.url)

console.log(statSync(`${BASE}${MEDIA_DIR}${host}${path}`))
```

## Getting an access token

Since the Instagram API now requires an access token for all requests, this module has a method for getting one.

1. Create an [Instagram client application](https://instagram.com/developer/clients/manage/). You should be able to set any options you want, but you should add a "Valid Redirect URI" (under the Security tab) for `http://localhost:3003`.
![uri screenshot](https://cldup.com/eMdMhh3L6L.png)
2. Once you've created your application you should be able to get the client ID and secret. It should look something like this:
![client screenshot](https://cldup.com/iBc4vAbLcc.png)
3. Run this command using your client ID and secret. This will open a browser window and prompt you to login to Instagrama and approve your application to access your account. By default the access token will have a scope for `basic` and `public_content`. See the Instagram API docs for [other possible scopes](https://www.instagram.com/developer/authorization/).
```sh
instagram-download --get_token --client=ID --secret=SECRET
# Or to request other scopes
instagram-download --get_token --client=ID --secret=SECRET --scope=basic --scope=likes --scope=comments
```
4. The access token will be printed to the CLI and opened browser window once authorization is complete.


## API Rate Limiting

This has changed as of June 1, 2016. See the new info in the [Instagram docs on rate limiting](https://www.instagram.com/developer/limits/).


## Debug Logging

This module uses [`debug`](https://www.npmjs.org/debug) to selectively log events. By default nothing is logged, but you can use the `DEBUG` environment variable to enable logging. All debug logging events use the namespace prefix `instagram-download:` with the suffixes `cli`, `download`, `read`, `options`, `api`, `json`, `media`. Here are some examples:

```sh
# Log everthing
DEBUG=instagram-download:* instagram-download ...

# Log only download events
DEBUG=instagram-download:download instagram-download ...

# Log download and api events
DEBUG=instagram-download:download,instagram-download:api instagram-download ...
```


## Contributing

This is written in ES6 and compiled to ES5 using [`babel`](https://babeljs.io/). The code you require will come from the `lib/` directory which gets compiled from `src/` before each `npm publish`.


## Tests

`npm test`


## License

MIT
