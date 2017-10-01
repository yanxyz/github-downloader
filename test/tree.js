const fs = require('fs')
const makeDir = require('make-dir')
const parse = require('../lib/parse')
const fetch = require('../lib/fetch')

const urlObj = parse('https://github.com/sindresorhus/got/tree/master/test')
fetch.getTree(urlObj)
  .then(data => {
    makeDir.sync('./temp')
    fs.writeFileSync('./temp/__tree.json', JSON.stringify(data, null, 2))
  })
