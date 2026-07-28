import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Exercises the real Table Storage write and the stats rollup against Azurite.
 * Skipped automatically when Azurite is not running, so `npm test` stays green
 * without it:
 *
 *   npx azurite-table --location /tmp/azurite --silent &
 */
const CONN =
  'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;' +
  'AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;' +
  'TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;';

const reachable = await fetch('http://127.0.0.1:10002/devstoreaccount1')
  .then(() => true)
  .catch(() => false);

describe('storage integration', { skip: reachable ? false : 'Azurite not running' }, () => {
  let recordEvent;
  let listEvents;

  before(async () => {
    process.env.STORAGE_CONNECTION = CONN;
    process.env.EVENTS_TABLE = `t${Date.now()}`;
    process.env.HASH_SECRET = 'test-secret';
    ({ recordEvent, listEvents } = await import('../src/shared/events.mjs'));
  });

  test('writes one row per install and aggregates correctly', async () => {
    const hdr = (ua, ip) => new Headers({ 'user-agent': ua, 'x-forwarded-for': ip });

    // Two installs from the same visitor, one from another, one bot.
    await recordEvent({ bundle: 'architect', version: '1.0.0', headers: hdr('thomast1906-skills-cli/0.1.0', '1.1.1.1') });
    await recordEvent({ bundle: 'architect', version: '1.0.0', headers: hdr('thomast1906-skills-cli/0.1.0', '1.1.1.1') });
    await recordEvent({ bundle: 'architect', version: '1.0.0', headers: hdr('thomast1906-skills-cli/0.1.0', '2.2.2.2') });
    await recordEvent({ bundle: 'architect', version: '1.0.0', headers: hdr('curl/8.4.0', '3.3.3.3') });

    const events = await listEvents('architect|');
    assert.equal(events.length, 4, 'append-only: one row per install');

    const cli = events.filter((e) => e.uaClass === 'cli');
    const bots = events.filter((e) => e.uaClass === 'bot');
    assert.equal(cli.length, 3);
    assert.equal(bots.length, 1, 'bots recorded but classified for exclusion');

    const uniques = new Set(cli.map((e) => e.visitorHash));
    assert.equal(uniques.size, 2, 'same IP+UA on the same day counts once');

    assert.ok(events.every((e) => !JSON.stringify(e).includes('1.1.1.1')), 'no IP persisted');
  });

  test('partition prefix isolates bundles', async () => {
    await recordEvent({
      bundle: 'terraform',
      version: '1.0.0',
      headers: new Headers({ 'user-agent': 'thomast1906-skills-cli/0.1.0' }),
    });

    const architect = await listEvents('architect|');
    const terraform = await listEvents('terraform|');

    assert.ok(architect.every((e) => e.bundle === 'architect'));
    assert.equal(terraform.length, 1);
  });
});
