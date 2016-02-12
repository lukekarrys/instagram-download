import path from 'path'
import {parse} from 'url'

export default ({mediaDir, url}) => {
  const parsed = parse(url)
  const stripped = `/${parsed.hostname}${parsed.pathname}`
  const dirname = mediaDir(path.dirname(stripped))
  const filepath = path.join(dirname, path.basename(stripped))

  return {filepath, dirname}
}
