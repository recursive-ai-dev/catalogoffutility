const path = require('node:path')
const { pathToFileURL } = require('node:url')

function externalURL(value) {
  try {
    const url = new URL(value)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null
    return url.href
  } catch {
    return null
  }
}

function developmentURL(value) {
  const safe = externalURL(value)
  if (!safe) throw new Error('VITE_DEV_SERVER_URL must be an HTTP(S) URL without credentials.')
  return safe
}

function isAppNavigation(value, initialURL) {
  try {
    const target = new URL(value)
    const initial = new URL(initialURL)
    // Top-level navigation stays on the entry document; child frames run apps.
    return target.protocol === initial.protocol && target.host === initial.host &&
      target.pathname === initial.pathname && target.search === initial.search
  } catch {
    return false
  }
}

function productionURL(directory) {
  return pathToFileURL(path.join(directory, 'dist', 'index.html')).href
}

module.exports = { externalURL, developmentURL, isAppNavigation, productionURL }
