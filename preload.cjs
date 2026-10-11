const { contextBridge } = require('electron')

// The previous preload looked for #chrome-version / #node-version /
// #electron-version elements that have never existed in index.html, so it did
// nothing at all. Diagnostics are now exposed through contextBridge — the
// contextIsolation-safe channel — instead of by reaching into the DOM.
//
// Sandboxed preloads receive a polyfilled `process` that includes `versions`.
contextBridge.exposeInMainWorld('voidRuntime', {
  versions: {
    chrome: process.versions['chrome'],
    node: process.versions['node'],
    electron: process.versions['electron'],
  },
  platform: process.platform,
})
