import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseBundle, resolve, handler } from '../src/functions/install.mjs';
import { classifyUa, visitorHash } from '../src/shared/events.mjs';

const req = (bundle, headers = {}) => ({
  params: { bundle },
  headers: new Headers({ 'user-agent': 'test', ...headers }),
});

test('parses bundle and optional pinned version', () => {
  assert.deepEqual(parseBundle('architect'), { name: 'architect', version: null });
  assert.deepEqual(parseBundle('architect@1.2.0'), { name: 'architect', version: '1.2.0' });
});

test('resolves known bundles and rejects unknown ones', () => {
  assert.ok(resolve('architect', null).url.includes('codeload.github.com'));
  assert.equal(resolve('does-not-exist', null), null);
});

test('pinned versions resolve to a tag ref', () => {
  assert.match(resolve('architect', '1.2.0').url, /refs\/tags\/v1\.2\.0$/);
});

test('redirects with 302 and no-store, never 301', async () => {
  const res = await handler(req('architect'), {});
  assert.equal(res.status, 302);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.ok(res.headers.Location.startsWith('https://codeload.github.com/'));
});

test('unknown bundle returns 404 listing what is available', async () => {
  const res = await handler(req('nope'), {});
  assert.equal(res.status, 404);
  assert.ok(res.jsonBody.available.includes('architect'));
});

test('storage failure must not break the install', async () => {
  // Malformed connection string: throws synchronously inside recordEvent, so
  // this exercises the try/catch without a network call.
  process.env.STORAGE_CONNECTION = 'this-is-not-a-connection-string';

  // Prove the write genuinely throws, so the assertion below is not vacuous.
  const { recordEvent } = await import('../src/shared/events.mjs');
  await assert.rejects(() =>
    recordEvent({ bundle: 'architect', version: '1.0.0', headers: new Headers() })
  );

  const errors = [];
  const res = await handler(req('architect'), { error: (...a) => errors.push(a) });

  assert.equal(res.status, 302, 'install must still redirect when storage fails');
  assert.equal(errors.length, 1, 'failure must be logged, not swallowed silently');
  delete process.env.STORAGE_CONNECTION;
});

test('classifies bots and CI separately from real clients', () => {
  assert.equal(classifyUa('thomast1906-skills-cli/0.1.0'), 'cli');
  assert.equal(classifyUa('Mozilla/5.0 Chrome/120'), 'browser');
  assert.equal(classifyUa('curl/8.4.0'), 'bot');
  assert.equal(classifyUa('GitHub-Actions/2.0'), 'ci');
});

test('visitor hash is stable within a day and uncorrelatable across days', () => {
  const a = visitorHash('1.2.3.4', 'ua', '2026-07-28');
  const b = visitorHash('1.2.3.4', 'ua', '2026-07-28');
  const c = visitorHash('1.2.3.4', 'ua', '2026-07-29');

  assert.equal(a, b, 'same visitor, same day -> same hash');
  assert.notEqual(a, c, 'salt must rotate daily');
  assert.doesNotMatch(a, /1\.2\.3\.4/, 'must not leak the IP');
});
