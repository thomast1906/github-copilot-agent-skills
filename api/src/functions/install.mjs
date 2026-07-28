import { app } from '@azure/functions';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { recordEvent } from '../shared/events.mjs';

// Loaded once at cold start. Resolution is an in-memory lookup so the hot path
// makes no outbound calls — hitting the GitHub API here would rate-limit at
// 60 req/hr unauthenticated and stall every install behind a round-trip.
const manifest = JSON.parse(
  readFileSync(fileURLToPath(new URL('../shared/manifest.json', import.meta.url)), 'utf8')
);

export function parseBundle(raw = '') {
  const [name, version] = decodeURIComponent(raw).split('@');
  return { name: name?.trim(), version: version?.trim() || null };
}

export function resolve(name, version) {
  const bundle = manifest.bundles[name];
  if (!bundle) return null;

  // Unpinned: whatever the manifest currently points at.
  if (!version) return { url: bundle.target.url, version: bundle.version };

  // Pinned: resolve against a release tag. 404s upstream if the tag is absent,
  // which is the honest failure mode until releases exist.
  return {
    url: `https://codeload.github.com/${manifest.repo}/tar.gz/refs/tags/v${version}`,
    version,
  };
}

export async function handler(request, context) {
  const { name, version } = parseBundle(request.params.bundle);
  const target = resolve(name, version);

  if (!target) {
    return {
      status: 404,
      jsonBody: {
        error: `Unknown bundle '${name}'`,
        available: Object.keys(manifest.bundles),
      },
    };
  }

  // Load-bearing try/catch: a storage outage must cost a data point, never
  // an install. Counts are nice; installs are the product.
  try {
    await recordEvent({ bundle: name, version: target.version, headers: request.headers });
  } catch (err) {
    context?.error?.('event write failed', err);
  }

  return {
    status: 302,
    headers: {
      Location: target.url,
      // 301 would be cached permanently by clients and CDNs: installs would
      // stop being observable within days and the target could never move.
      'Cache-Control': 'no-store',
    },
  };
}

app.http('install', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'i/{bundle}',
  handler,
});
