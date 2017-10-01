const parse = require('../lib/parse')
const fetch = require('../lib/fetch')

const urlObj = parse('https://github.com/electron/electron/blob/master/docs/README.md')
urlObj.filename = 'temp/' + urlObj.path
fetch.file(urlObj)
