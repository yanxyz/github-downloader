const fs = require('fs')
const pathUtil = require('path')
const util = require('util')
const got = require('got')
const makeDir = require('make-dir')
const pMap = require('p-map')
const { token } = require('../config')

const treeJsonFile = './__tree.json'
const debug = util.debuglog('ghd')

/**
 * query Github API
 */
function query(body) {
  return got('https://api.github.com/graphql', {
    json: true,
    headers: {
      Authorization: 'bearer ' + token
    },
    body
  }).then(res => res.body)
}

async function getTree({ owner, repo, ref, path }) {
  const body = {
    query: `
query {
  repository(owner: "${owner}", name: "${repo}") {
    object(expression:"${ref}:${path}") {
      ... on Tree {
        entries {
          name
          type
        }
      }
    }
  }
}
`
  }

  const data = await query(body)
  if (data.errors) {
    throw new Error(data.errors[0])
  }
  const object = data.data.repository.object
  if (object == null) {
    throw new Error('Not a dir: ' + path)
  }
  const entries = object.entries
  for (const item of entries) {
    item.path = path + '/' + item.name
    if (item.type === 'tree') {
      item.tree = await getTree({ owner, repo, ref, path: item.path })
    } else {
      item.rawUrl = formatUrl(owner, repo, ref, item.path)
    }
  }
  return entries
}

function formatUrl(owner, repo, ref, path) {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`
}

function transform(tree, root) {
  const ret = []

  function f(list) {
    list.forEach(x => {
      if (x.tree) {
        f(x.tree)
      } else {
        ret.push(x)
      }
    })
  }

  f(tree)
  return ret
}

async function download(url, filename) {
  const dir = pathUtil.dirname(filename)
  if (dir !== '.') await makeDir(dir)
  return new Promise((resolve, reject) => {
    const r = got.stream(url)
      .on('error', err => {
        w.end()
        reject(err)
      })
    const w = fs.createWriteStream(filename)
      .on('close', () => {
        resolve()
      })
      .on('error', err => {
        reject(err)
      })
    r.pipe(w)
  })
}

function downloadItem({ rawUrl, path }) {
  debug(rawUrl)
  return download(rawUrl, path)
}

/**
 * Fetch dir
 */
module.exports = async function (options) {
  const tree = await getTree(options)
  fs.writeFileSync(treeJsonFile, JSON.stringify({
    url: options,
    tree
  }, null, 2))
  const list = transform(tree, options.path)
  return pMap(list, downloadItem, { concurrency: 5 })
}

/**
 * Fetch file
 *
 * @param {String} filename a optional saved name
 */
module.exports.file = async function ({ owner, repo, ref, path, filename }) {
  filename = filename || path
  const url = formatUrl(owner, repo, ref, path)
  return download(url, filename)
}

module.exports.getTree = getTree

/**
 * Fetch dir using the cached file __tree.json
 */
module.exports.retry = function () {
  if (!fs.existsSync(treeJsonFile)) {
    console.error('Could not find the cached file __tree.json')
    return
  }

  const data = require(pathUtil.resolve(treeJsonFile))
  const list = transform(data.tree, data.url.path)
  return pMap(list, downloadItem, { concurrency: 5 })
}
