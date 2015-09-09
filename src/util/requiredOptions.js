import keys from 'lodash/object/keys'
import some from 'lodash/collection/some'
import includes from 'lodash/collection/includes'

const debug = require('./debug')('options')

export default (options, required) => {
  const optKeys = keys(options)
  optKeys.forEach((key) => debug(`OPT ${key} ${options[key]}`))

  if (some(required || [], (key) => !includes(optKeys, key))) {
    throw new Error(`${required.join(', ')} options are required`)
  }

  return options
}
