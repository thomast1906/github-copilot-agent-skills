import { createHmac, randomUUID } from 'node:crypto';
import { TableClient } from '@azure/data-tables';

const TABLE = () => process.env.EVENTS_TABLE ?? 'installs';
const CONN = () => process.env.STORAGE_CONNECTION;
const SECRET = () => process.env.HASH_SECRET ?? '';

let clientPromise;
let clientKey;

/**
 * SWA managed functions do not support Managed Identity, so this necessarily
 * uses a connection string. Keep it in SWA application settings, never in the
 * repo, and scope the SAS to table write access only.
 *
 * Settings are read per call rather than at import: Functions app settings are
 * a runtime concern, and import-time capture makes the failure path untestable.
 */
function getClient() {
  const conn = CONN();
  if (!conn) return null;

  if (clientKey !== conn) {
    clientKey = conn;
    clientPromise = (async () => {
      const client = TableClient.fromConnectionString(conn, TABLE(), {
        allowInsecureConnection: true,
      });
      await client.createTable().catch(() => {});
      return client;
    })();
  }
  return clientPromise;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Irreversible per-day visitor hash. The salt is derived from the date, so it
 * rotates itself at midnight with no cron and no stored state — yesterday's
 * hashes cannot be correlated with today's. No IP is ever persisted.
 */
export function visitorHash(ip, ua, date = today()) {
  return createHmac('sha256', `${SECRET()}|${date}`)
    .update(`${ip}|${ua}`)
    .digest('hex')
    .slice(0, 16);
}

/** Classify rather than filter, so counts can be re-cut later. */
export function classifyUa(ua = '') {
  const s = ua.toLowerCase();
  if (!s) return 'unknown';
  if (/thomast1906-skills-cli/.test(s)) return 'cli';
  if (/(github-actions|ci|jenkins|circleci|buildkite|renovate|dependabot)/.test(s)) return 'ci';
  if (/(bot|crawler|spider|scrape|curl|wget|python-requests|go-http)/.test(s)) return 'bot';
  if (/(mozilla|chrome|safari|firefox|edge)/.test(s)) return 'browser';
  return 'other';
}

function clientIp(headers) {
  const xff = headers.get('x-forwarded-for') ?? headers.get('x-azure-clientip') ?? '';
  // x-forwarded-for may include a port and a proxy chain; take the first hop.
  return xff.split(',')[0].trim().replace(/:\d+$/, '') || 'unknown';
}

/**
 * Append-only event write. One row per install; aggregation happens on read.
 * A read-modify-write counter would need ETag retry loops under concurrency —
 * appends have none, and give per-day granularity for free.
 */
export async function recordEvent({ bundle, version, headers }) {
  const client = await getClient();
  if (!client) return false;

  const date = today();
  const ua = headers.get('user-agent') ?? '';

  await client.createEntity({
    partitionKey: `${bundle}|${date}`,
    rowKey: randomUUID(),
    bundle,
    version,
    date,
    uaClass: classifyUa(ua),
    visitorHash: visitorHash(clientIp(headers), ua, date),
    country: headers.get('x-azure-clientcountry') ?? '',
  });

  return true;
}

export async function listEvents(prefix) {
  const client = await getClient();
  if (!client) return [];
  const filter = prefix
    ? `PartitionKey ge '${prefix}' and PartitionKey lt '${prefix}~'`
    : undefined;
  const out = [];
  for await (const e of client.listEntities({ queryOptions: filter ? { filter } : undefined })) {
    out.push(e);
  }
  return out;
}
