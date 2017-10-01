const assert = require('assert')
const parse = require('../lib/parse')

function t(callback) {
  callback()
}

t(() => {
  const url = 'https://github.com/electron/electron/tree/master/docs/'
  assert.deepStrictEqual(parse(url), {
    owner: 'electron',
    repo: 'electron',
    ref: 'master',
    path: 'docs',
    isFile: false,
    url: url.slice(0, -1)
  })
})

t(() => {
  const url = 'https://github.com/electron/electron/blob/torycl/u-61/docs/faq.md'
  assert.deepStrictEqual(parse(url, 'torycl/u-61'), {
    owner: 'electron',
    repo: 'electron',
    ref: 'torycl/u-61',
    path: 'docs/faq.md',
    isFile: true,
    url
  })
})

