import keys from 'lodash/keys'
import some from 'lodash/some'
import includes from 'lodash/includes'

const debug = require('./debug')('options')

export default (options, required) => {
  const optKeys = keys(options)
  optKeys.forEach((key) => debug(`OPT ${key} ${options[key]}`))

  if (some(required || [], (key) => !includes(optKeys, key))) {
    throw new Error(`${required.join(', ')} options are required`)
  }

  return options
}
