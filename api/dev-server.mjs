#!/usr/bin/env node
/**
 * Local dev server. Mounts the same handlers the Functions host runs, so the
 * redirect and storage paths can be exercised with nothing but Node — no
 * Azure Functions Core Tools required.
 *
 *   npm run dev --prefix api
 *
 * Routing mirrors staticwebapp.config.json:
 *   /i/{bundle}  -> install
 *   /api/stats   -> stats
 *
 * This is a development convenience, not a production host. `swa start` runs
 * the real Functions runtime if you need full fidelity.
 */

import { createServer } from 'node:http';
import { handler as install } from './src/functions/install.mjs';
import { handler as stats } from './src/functions/stats.mjs';

const PORT = Number(process.env.PORT ?? 4280);

const ctx = {
  error: (...a) => console.error('  [error]', ...a),
  log: (...a) => console.log('  [log]', ...a),
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string') headers.set(k, v);
  }
  // The Functions host sees a forwarded client IP; fake one locally so the
  // visitor-hash path behaves the same.
  if (!headers.has('x-forwarded-for')) headers.set('x-forwarded-for', '127.0.0.1');

  let result;
  const install_ = url.pathname.match(/^\/i\/(.+)$/);

  if (install_) {
    result = await install({ params: { bundle: install_[1] }, headers }, ctx);
  } else if (url.pathname === '/api/stats') {
    result = await stats({ query: url.searchParams, headers }, ctx);
  } else {
    result = { status: 404, jsonBody: { error: 'not found', try: ['/i/{bundle}', '/api/stats'] } };
  }

  const status = result.status ?? 200;
  const outHeaders = { ...(result.headers ?? {}) };
  let body = result.body;

  if (result.jsonBody !== undefined) {
    outHeaders['Content-Type'] = 'application/json';
    body = JSON.stringify(result.jsonBody, null, 2);
  }

  console.log(`${req.method} ${url.pathname} -> ${status}${outHeaders.Location ? ` -> ${outHeaders.Location}` : ''}`);
  res.writeHead(status, outHeaders);
  res.end(body ?? '');
});

server.listen(PORT, () => {
  const storage = process.env.STORAGE_CONNECTION
    ? 'connected'
    : 'NOT configured (redirects work, nothing is counted)';
  console.log(`\nInstall counter dev server on http://localhost:${PORT}`);
  console.log(`  storage: ${storage}\n`);
  console.log(`  curl -sI http://localhost:${PORT}/i/architect`);
  console.log(`  curl -s  http://localhost:${PORT}/api/stats\n`);
});
