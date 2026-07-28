import { app } from '@azure/functions';
import { listEvents } from '../shared/events.mjs';

/**
 * Aggregates append-only events into per-bundle daily counts.
 *
 * Bots and CI are excluded from the headline figures but returned separately,
 * so an inflated number can always be traced rather than silently absorbed.
 */
export async function handler(request) {
  const bundle = request.query.get('bundle');

  let events;
  try {
    events = await listEvents(bundle ? `${bundle}|` : null);
  } catch {
    return { status: 503, jsonBody: { error: 'stats unavailable' } };
  }

  const bundles = {};
  for (const e of events) {
    const b = (bundles[e.bundle] ??= { total: 0, excluded: 0, daily: {} });
    const counted = e.uaClass !== 'bot' && e.uaClass !== 'ci';

    if (!counted) { b.excluded += 1; continue; }

    b.total += 1;
    const day = (b.daily[e.date] ??= { count: 0, uniques: new Set() });
    day.count += 1;
    day.uniques.add(e.visitorHash);
  }

  const out = {};
  for (const [name, b] of Object.entries(bundles)) {
    out[name] = {
      total: b.total,
      excludedBotsAndCi: b.excluded,
      daily: Object.fromEntries(
        Object.entries(b.daily)
          .sort(([a], [c]) => a.localeCompare(c))
          .map(([d, v]) => [d, { count: v.count, uniques: v.uniques.size }])
      ),
    };
  }

  return {
    jsonBody: { generatedAt: new Date().toISOString(), bundles: out },
    headers: { 'Cache-Control': 'public, max-age=300' },
  };
}

app.http('stats', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'stats',
  handler,
});
