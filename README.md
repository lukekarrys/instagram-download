instagram-download
===================

Download all the Instagram JSON data and media for a user.

[![NPM](https://nodei.co/npm/instagram-download.png)](https://nodei.co/npm/instagram-download/)
[![Build Status](https://travis-ci.org/lukekarrys/instagram-download.png?branch=master)](https://travis-ci.org/lukekarrys/instagram-download)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)


## Install

`npm install instagram-download`

You may want to use the `--global` option when installing if you want to use the CLI globally on your machine.


## Usage

```js
import download, {read} from 'instagram-download'

// Download data for a user to a directory using an API client/secret
download({
  client,
  secret,
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
# Download data for a user to a directory using an API client/secret
instagram-download --client=CLIENT --secret=SECRET --user=USER --dir=DIR [--refresh --full]

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

#### `client`, `secret` (string, required for `download`)

The client ID and secret of your Instagram client application. If you don't have one you'll need to [create one](https://instagram.com/developer/clients/manage/).

#### `refresh` (boolean, optional, default `false`)

By default running `instagram-download` again will start after the most recent Instagram post that was downloaded previously, so that you can easily only fetch the latest Instagram data. Use the `refresh` option to overwrite all the existing Instagram data. Note that Instagram photos are never redownloaded because they should never change after being posted.

#### `full` (boolean, optional, default `false`)

By default the Instagram API only includes a few likes and comments with each post. You have the option (at the expense of two extra API requests per post) to fetch as many likes and comments as Instagram allows (which right now is ~120 each). You shouldn't hit any rate limits when using this option unless you have more than `2462` posts. See the [API Rate Limiting](#api-rate-limiting) section below for more detailed info about this.


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


## API Rate Limiting

The Instagram API allows 5000 requests per hour and can fetch `33` posts per page. That means you should only run into rate limiting issues if you are using the `full` option **and** have over `2462` posts. If you do hit rate limit issues you should be able to wait an hour until the limit is reset and run the command again since `instagram-download` by default won't make API requests for posts that already exist in the output directory.


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
