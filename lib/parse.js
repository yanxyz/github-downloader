/**
 * @see /test/parse.js
 */

module.exports = function (url, refname) {
  url = url.replace(/\/$/, '')
  const m = url.match(re(refname))
  if (m == null) {
    throw new Error(`Url does not match pattern
${url}
https://github.com/:owner/:repo/(tree|blob)/:branch/:path`)
  }
  const [, owner, repo, ref, path] = m
  // file url includes /blob/;
  // dir url includes /tree/
  const isFile = url.startsWith(`https://github.com/${owner}/${repo}/blob/`)
  return { owner, repo, ref, path, isFile, url }
}

function re(refname) {
  const arr = [
    '^https://github\\.com/([^/\\s]+)/([^/\\s]+)/(?:tree|blob)/',
    '([^/\\s]+)',
    '/([^\\s]+)$'
  ]
  if (refname) {
    // valid chars of refname: git help check-ref-format
    // escape the most possible char '\', '.'
    arr[1] = '(' + refname.replace(/[\\.]/g, '\\$&') + ')'
  }
  return new RegExp(arr.join(''))
}
