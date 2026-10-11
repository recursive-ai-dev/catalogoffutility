import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const { externalURL, developmentURL, isAppNavigation, productionURL } = require('../electron-policy.cjs');

test('only credential-free HTTP(S) links can open an external application', () => {
  for (const value of ['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,test', 'mailto:a@example.test', 'https://user:pass@example.test/', 'not a URL']) {
    assert.equal(externalURL(value), null, value);
  }
  assert.equal(externalURL('https://example.test/docs'), 'https://example.test/docs');
});

test('development configuration fails with an actionable error', () => {
  assert.throws(() => developmentURL('file:///tmp/app'), /VITE_DEV_SERVER_URL/);
  assert.equal(developmentURL('http://localhost:3000'), 'http://localhost:3000/');
});

test('the top-level shell permits hash navigation only on its entry page', () => {
  const root = 'http://localhost:3000/';
  assert.equal(isAppNavigation(root + '#main-content', root), true);
  for (const target of ['http://localhost:3000/agent-smith.html', 'https://example.test/', 'http://localhost:3000/?redirect=1', 'http://localhost:3001/']) {
    assert.equal(isAppNavigation(target, root), false, target);
  }
});

test('packaged navigation cannot replace the shell with another local file', () => {
  const root = productionURL('/home/user/Archive With Spaces');
  assert.equal(root, 'file:///home/user/Archive%20With%20Spaces/dist/index.html');
  assert.equal(isAppNavigation(root + '#main-content', root), true);
  assert.equal(isAppNavigation('file:///etc/passwd', root), false);
});
