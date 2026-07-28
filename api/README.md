# Install counter

Counts real per-bundle installs of the skill bundles.

`GET /i/{bundle}` records an install and `302`s to the download. Counting is a
server-side property of the redirect, so the CLI ships no telemetry — there is
nothing running on a user's machine to audit or opt out of.

| Endpoint | Purpose |
|---|---|
| `GET /i/{bundle}` | Record an install, redirect to the download |
| `GET /api/stats` | Aggregate counts, bots and CI excluded |

## Testing locally

Four levels, cheapest first. Run everything from the repository root.

### 1. Unit tests — no dependencies

```bash
npm ci --prefix api
npm test --prefix api
```

Covers redirect behaviour, version resolution, bot classification, visitor
hashing, and that a storage failure still returns a `302`. The storage
integration test skips automatically.

### 2. Integration tests — real Table Storage

```bash
npm run azurite --prefix api &     # Azurite on 127.0.0.1:10002
npm test --prefix api
```

Now all tests run, including append-only writes, unique-visitor dedup, and the
assertion that no IP is ever persisted.

### 3. Dev server — end-to-end, Node only

No Azure Functions Core Tools needed. Mounts the same handlers the Functions
host runs.

```bash
npm run azurite --prefix api &

export STORAGE_CONNECTION='DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;'
export HASH_SECRET=dev-secret

npm run dev --prefix api           # http://localhost:4280
```

`STORAGE_CONNECTION` is optional: without it redirects still work and nothing is
counted, which is exactly how production degrades if storage fails.

Then, in another shell:

```bash
# Expect: 302, Location: codeload..., Cache-Control: no-store
curl -sI -A "thomast1906-skills-cli/0.1.0" http://localhost:4280/i/architect

# Expect: 404 listing the available bundles
curl -s http://localhost:4280/i/nope

# Simulate two visitors plus a bot
curl -s -o /dev/null -A "thomast1906-skills-cli/0.1.0" -H "x-forwarded-for: 1.1.1.1" http://localhost:4280/i/architect
curl -s -o /dev/null -A "thomast1906-skills-cli/0.1.0" -H "x-forwarded-for: 1.1.1.1" http://localhost:4280/i/architect
curl -s -o /dev/null -A "curl/8.4.0" http://localhost:4280/i/architect

# Expect: total 2, uniques 1, excludedBotsAndCi 1
curl -s http://localhost:4280/api/stats
```

Exercise the CLI against it:

```bash
npm install --prefix cli

SKILLS_INSTALL_HOST=http://localhost:4280 \
SKILLS_MANIFEST_URL="$PWD/api/src/shared/manifest.json" \
  node cli/bin/cli.mjs add diagramming --dir=/tmp/skills-test
```

Stop the services with `kill <pid>` and remove `api/.azurite`.

### 4. Full fidelity — the real Functions runtime

Only needed when verifying `staticwebapp.config.json` routing rules, since the
dev server hard-codes the equivalent routes.

```bash
npm install -g azure-functions-core-tools@4
npx @azure/static-web-apps-cli start swa --api-location api
```

## Deploying

```bash
./infra/deploy.sh
```

Idempotent. Creates the resource group, storage account, and Free-tier Static
Web App, then deploys. `HASH_SECRET` is preserved across re-runs so
unique-visitor continuity survives a redeploy.

## Design notes

- **`302`, never `301`.** A `301` is cached permanently by clients and CDNs, so
  installs would stop being observable and the target could never move.
- **Storage writes are wrapped in `try/catch`.** An outage costs a data point,
  never an install.
- **Events are append-only.** A read-modify-write counter needs ETag retry loops
  under concurrency; appends have none and give per-day granularity for free.
- **Visitor hashes use a date-derived salt.** Uniques without storing an IP, and
  yesterday's hashes cannot be correlated with today's.
- **The manifest is generated** from `packages/*/apm.yml`, so redirect targets
  cannot drift from bundle definitions, and the hot path never calls the GitHub
  API — 60 req/hr unauthenticated would break installs within the hour.
- **SWA managed functions do not support Managed Identity**, so a storage
  connection string is unavoidable. It lives only in app settings.
