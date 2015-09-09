import test from 'tape'

import requiredOptions from '../src/util/requiredOptions'

test('required options', (t) => {
  const options = {one: 1, two: false, three: null}

  t.doesNotThrow(() => requiredOptions(options, ['one', 'two', 'three']))
  t.throws(() => requiredOptions(options, ['one', 'two', 'three', 'four']))
  t.equal(requiredOptions(options).one, 1)

  t.end()
})
