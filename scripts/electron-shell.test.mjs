import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../main.cjs', import.meta.url), 'utf8');

async function shellFixture({ primary = true, devURL } = {}) {
  const windows = [];
  const opened = [];
  const app = new EventEmitter();
  app.requestSingleInstanceLock = () => primary;
  app.quit = () => { app.didQuit = true; };
  app.whenReady = async () => {};
  app.isPackaged = false;
  class Window {
    constructor(options) {
      this.options = options;
      this.webContents = new EventEmitter();
      this.webContents.setWindowOpenHandler = handler => { this.openHandler = handler; };
      this.webContents.session = {
        setPermissionRequestHandler: handler => { this.permissionRequest = handler; },
        setPermissionCheckHandler: handler => { this.permissionCheck = handler; },
      };
      this.events = new EventEmitter();
      windows.push(this);
    }
    once(...args) { this.events.once(...args); }
    isDestroyed() { return false; }
    isMinimized() { return true; }
    restore() { this.restored = true; }
    focus() { this.focused = true; }
    show() { this.shown = true; }
    async loadURL(url) { this.loadedURL = url; }
    static getAllWindows() { return windows; }
  }
  const electron = { app, BrowserWindow: Window, shell: { openExternal: async url => { opened.push(url); } } };
  vm.runInNewContext(source, {
    require: name => name === 'electron' ? electron : name === './electron-policy.cjs' ? require('../electron-policy.cjs') : require(name),
    __dirname: '/test/archive',
    process: { env: devURL === undefined ? {} : { VITE_DEV_SERVER_URL: devURL }, platform: 'linux' },
    console: { error() {}, warn() {} },
  });
  await new Promise(resolve => setImmediate(resolve));
  return { app, windows, opened, win: windows[0] };
}

test('the desktop shell starts with an isolated, sandboxed renderer and CJS preload', async () => {
  const { win } = await shellFixture();
  assert.equal(win.loadedURL, 'http://localhost:3000/');
  assert.equal(win.options.webPreferences.nodeIntegration, false);
  assert.equal(win.options.webPreferences.contextIsolation, true);
  assert.equal(win.options.webPreferences.sandbox, true);
  assert.equal(win.options.webPreferences.preload, '/test/archive/preload.cjs');
});

test('popups are denied while validated HTTP links open externally', async () => {
  const { win, opened } = await shellFixture();
  assert.equal(win.openHandler({ url: 'javascript:alert(1)' }).action, 'deny');
  assert.equal(win.openHandler({ url: 'https://example.test/' }).action, 'deny');
  assert.deepEqual(opened, ['https://example.test/']);
});

test('main-frame replacements and webviews are blocked', async () => {
  const { win, opened } = await shellFixture();
  let blocked = 0;
  const event = { preventDefault() { blocked++; } };
  win.webContents.emit('will-navigate', event, 'http://localhost:3000/#main-content');
  assert.equal(blocked, 0);
  win.webContents.emit('will-navigate', event, 'https://example.test/');
  win.webContents.emit('will-attach-webview', event);
  assert.equal(blocked, 2);
  assert.deepEqual(opened, ['https://example.test/']);
});

test('embedded content cannot request host device permissions', async () => {
  const { win } = await shellFixture();
  let decision;
  win.permissionRequest(null, 'camera', value => { decision = value; });
  assert.equal(decision, false);
  assert.equal(win.permissionCheck(null, 'microphone'), false);
});

test('a second launch restores and focuses the first window', async () => {
  const { app, win } = await shellFixture();
  app.emit('second-instance');
  assert.equal(win.restored, true);
  assert.equal(win.focused, true);
});

test('secondary processes exit without creating a window', async () => {
  const { app, windows } = await shellFixture({primary:false});
  assert.equal(app.didQuit, true);
  assert.equal(windows.length, 0);
});

test('invalid dev URLs terminate startup without constructing a renderer', async () => {
  const { app, windows } = await shellFixture({devURL:'file:///etc/passwd'});
  assert.equal(app.didQuit, true);
  assert.equal(windows.length, 0);
});
