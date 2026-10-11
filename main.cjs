const { app, BrowserWindow, shell } = require('electron')
const path = require('node:path')
const { externalURL, developmentURL, isAppNavigation, productionURL } = require('./electron-policy.cjs')

// `npm run dev` binds Vite to port 3000 (see package.json). This used to point
// at Vite's default 5173, so `electron:start` against a running dev server
// loaded a dead origin. Override with VITE_DEV_SERVER_URL when needed.
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000'

// A second launch focuses the existing shell rather than starting another one.
const primaryInstance = app.requestSingleInstanceLock()
if (!primaryInstance) app.quit()

function openExternal(value) {
  const safe = externalURL(value)
  if (safe) void shell.openExternal(safe).catch(() => {
    console.warn('[void] The external link could not be opened.')
  })
}

const createWindow = () => {
  const entryURL = app.isPackaged ? productionURL(__dirname) : developmentURL(DEV_SERVER_URL)
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 360,
    minHeight: 480,
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      // Explicit rather than relying on Electron's defaults, which have changed
      // across majors. The renderer only ever loads first-party bundle output.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
      webviewTag: false,
    },
  })

  // Avoid the white flash before the void paints its first frame.
  win.once('ready-to-show', () => { if (!win.isDestroyed()) win.show() })

  // External links open in the OS browser instead of navigating the app shell.
  win.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url)
    return { action: 'deny' }
  })

  win.webContents.on('will-navigate', (event, url) => {
    if (isAppNavigation(url, entryURL)) return
    event.preventDefault()
    openExternal(url)
  })
  win.webContents.on('will-attach-webview', (event) => event.preventDefault())
  win.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false))
  win.webContents.session.setPermissionCheckHandler(() => false)
  win.webContents.on('render-process-gone', () => {
    if (!win.isDestroyed()) win.show()
    console.error('[void] The archive renderer stopped; close and reopen the application.')
  })

  // In production, load the local index.html.
  // In development, load the vite dev server url.
  void win.loadURL(entryURL).catch(() => {
    if (!win.isDestroyed()) win.show()
    console.error('[void] Could not load the archive. For development, start npm run dev first.')
  })
}

if (primaryInstance) app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}).catch((error) => {
  console.error('[void] Desktop startup failed:', error.message)
  app.quit()
})

app.on('second-instance', () => {
  const win = BrowserWindow.getAllWindows()[0]
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
