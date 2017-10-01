#!/usr/bin/env node

const parse = require('./lib/parse')
const fetch = require('./lib/fetch')
const argv = require('yargs-parser')(process.argv.slice(2), {
  alias: {
    help: ['h']
  },
  boolean: ['help', 'name']
})

const firstArg = argv._[0]
if (argv.help || !firstArg) {
  showHelp()
}

if (firstArg === 'retry') {
  fetch.retry()
} else {
  const urlObj = parse(firstArg)
  print(urlObj)
  if (urlObj.isFile) {
    if (argv.name) urlObj.filename = argv.name
    fetch.file(urlObj)
  } else {
    fetch(urlObj)
  }
}

function showHelp() {
  const cmd = 'ghd'
  console.log(`${cmd} <url> [options]

Options:
  --ref     specify the refname if it includes '/', '.'
  --name    specify a optional saved name when url is a file

Example:
  ${cmd} https://github.com/electron/electron/tree/master/docs
`)
  process.exit()
}

function print(obj) {
  for (const [key, value] of Object.entries(obj)) {
    console.log(key + ':', value)
  }
  console.log('Start...')
}
