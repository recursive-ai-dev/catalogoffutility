const { app, BrowserWindow, shell } = require('electron')
const path = require('node:path')

// `npm run dev` binds Vite to port 3000 (see package.json). This used to point
// at Vite's default 5173, so `electron:start` against a running dev server
// loaded a dead origin. Override with VITE_DEV_SERVER_URL when needed.
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:3000'

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Explicit rather than relying on Electron's defaults, which have changed
      // across majors. The renderer only ever loads first-party bundle output.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
    },
  })

  // Avoid the white flash before the void paints its first frame.
  win.once('ready-to-show', () => win.show())

  // External links open in the OS browser instead of navigating the app shell.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // In production, load the local index.html.
  // In development, load the vite dev server url.
  const isDev = !app.isPackaged
  if (isDev) {
    win.loadURL(DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
