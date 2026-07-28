# Install counter — build notes

Handover notes for the install-counting work. Written 2026-07-28.

Branch: `feat/site-and-metrics` (branched from `origin/feat/site-improvements`).
**Not pushed. `main` is untouched.**

---

## Goal

Track real downloads/installs of the skills and agents in this repo, in the
style of verified-skill.com and lobehub, but self-hosted.

## What the investigation found

Worth reading before changing direction, because these findings drove every
decision that followed.

**The third-party registries publish no numbers.** verified-skill.com exposes
only a trust tier (`T3 — VERIFIED`) for this repo; lobehub exposes nothing.
Neither has a public API. They are discovery surfaces, not metrics sources, so
there is nothing to scrape.

**They also send almost no traffic.** GitHub's referrer data at the time showed
`thomasthornton.cloud` (76), `github.com` (75), `reddit.com` (57), `Google`
(30) — verified-skill.com and lobehub did not appear at all.

**GitHub traffic data is a weak proxy and expires.** The API works
(663 clones / 181 uniques over 14 days, 190 stars at the time) but:

- Only 14 days are retained, so history must be accumulated by a scheduled job.
- Clones include CI, Renovate and bots, so it is not an install count.
- `traffic/popular/paths` gives per-skill numbers, but they are *GitHub page
  views of SKILL.md*, and only 3 of 16 skills had any signal at all.

**There is no install chokepoint.** verified-skill.com can count installs
because installs flow through their CLI. Installs here are `git clone` straight
from GitHub, so nothing observes them.

## The decision

Counting requires a chokepoint. The rejected option was a `curl | bash`
installer that phones home — for a repo whose audience cares about skill
supply-chain security, shipping a beacon undermines the trust it is trying to
demonstrate.

**The chosen approach inverts it:** don't make the client phone home, make the
*download flow through a redirect you own*.

```
user runs install
  └─ GET https://<host>/i/architect
       └─ Function: append one event row to Table Storage
            └─ 302 → codeload.github.com/.../tar.gz/refs/heads/main
```

Counting becomes a property of distribution, not surveillance — the same way
npm, PyPI and Homebrew count. Nothing runs on a user's machine, so there is no
telemetry to disclose or opt out of.

## What was built

```
api/
  dev-server.mjs            Local dev server (plain Node, no Functions tooling)
  host.json                 Functions host config
  README.md                 Usage + the four local testing levels
  src/functions/install.mjs GET /i/{bundle} → 302
  src/functions/stats.mjs   GET /api/stats  → aggregated counts
  src/shared/events.mjs     Table Storage writes, hashing, UA classification
  src/shared/manifest.json  Generated — do not edit by hand
  test/install.test.mjs     8 unit tests
  test/storage.test.mjs     2 integration tests (skip without Azurite)
cli/
  bin/cli.mjs               npx @thomast1906/skills add <bundle>
infra/
  deploy.sh                 az CLI provisioning + deploy, run manually
scripts/
  build-manifest.mjs        Generates manifest from packages/*/apm.yml
swa/
  index.html                Placeholder page (SWA needs a static root)
  staticwebapp.config.json  Routes /i/* → /api/i/*
```

Two commits: `8997bdc` (counter + CLI) and `8656e0a` (dev server + docs).

## Design decisions and why

Each of these exists for a specific failure it prevents.

- **`302`, never `301`.** A `301` is cached permanently by clients and CDNs:
  installs would stop being observable within days, and the redirect target
  could never be moved.
- **Storage writes wrapped in `try/catch`.** An outage costs a data point, never
  an install. Counts are nice; installs are the product.
- **Write synchronously, not fire-and-forget.** The Functions host can terminate
  an invocation once the response is returned, silently losing writes. A single
  Table insert is ~5–10ms.
- **Append-only events, partitioned `bundle|date`.** A read-modify-write counter
  needs ETag retry loops under concurrency; appends have no contention and give
  per-day granularity for free.
- **Visitor hash salted by date** (`hmac(SECRET, date|ip|ua)`). Uniques without
  storing an IP, and the salt rotates itself at midnight with no cron, so
  yesterday's hashes cannot be correlated with today's.
- **Bots classified, not dropped.** `uaClass` is stored so inflated numbers can
  be re-cut later rather than silently absorbed.
- **Manifest generated from `packages/*/apm.yml`.** Redirect targets cannot
  drift from bundle definitions, and resolution is an in-memory lookup — calling
  the GitHub API on the hot path would rate-limit at 60 req/hr unauthenticated
  and break installs within the hour.
- **`--from-github` flag on the CLI.** Bypasses the redirect entirely. Costs a
  few counts, buys transparency, and doubles as the fallback when the host is
  cold (SWA Free has no SLA).

## Verified

Not assumed — actually run.

- 10/10 tests pass, including real Table Storage writes against Azurite:
  append-only behaviour, unique dedup (same IP+UA/day → one hash), bot
  exclusion, partition isolation, and no IP persisted.
- Dev server end-to-end: `302` + `no-store` + correct `Location`; 404 listing
  available bundles; `/api/stats` returning `total: 3, uniques: 2,
  excludedBotsAndCi: 1` from simulated traffic.
- CLI end-to-end through the counter: installed `diagramming`, extracted 3
  skills, install appeared in stats.
- Every `az` command in `infra/deploy.sh` checked against az CLI 2.86.0.
- Astro site still builds (19 pages, unchanged).

## Two bugs found mid-build

Both are fixed; noting them because they were subtle.

1. **A vacuous test.** "Storage failure must not break the install" passed in
   0.13ms — it never ran. `STORAGE_CONNECTION` was captured at module load, so
   setting it inside the test did nothing. That was also a real defect: app
   settings are a runtime concern. Now read lazily, and the test asserts the
   write genuinely rejects before checking the `302` still happens.
2. **Silent storage-name truncation.** `stskillsprodwesteurope001` is 25 chars
   and was being cut to 24, mangling the instance number. Now uses region short
   codes (`stskillsprodweu001`) and fails loudly on overflow.

## Deliberately dropped

- **GitHub traffic metrics dashboard.** Built, then removed on request — it
  showed clone counts and per-skill *page views*, where only 3 of 16 skills had
  any signal. Preserved on the tag `archive/traffic-metrics` (commit `967195e`),
  which contains the collector script, daily workflow, `/metrics` page and
  Sparkline component. It was an amended-away commit and would have been
  garbage-collected, so the tag is what keeps it alive — do not delete it unless
  you are sure. Recover with:

  ```bash
  git checkout archive/traffic-metrics -- scripts/collect-metrics.mjs \
    .github/workflows/metrics.yml src/pages/metrics src/components/ui/Sparkline.astro
  ```
- **Deploying Azure from GitHub Actions.** Removed on request; provisioning is
  `infra/deploy.sh`, run manually.
- **Fixes to `deploy.yml`** (a `squad/**` trigger that builds pointlessly, and
  outdated action versions). Reverted as unrelated scope creep — still worth
  doing separately.

## Not done

- **Nothing is deployed.** Counts read zero until `./infra/deploy.sh` runs and
  install instructions point at the endpoint.
- **CLI is not published to npm.** Intended: OIDC trusted publishing with
  `--provenance`, no long-lived token.
- **No releases exist**, so `@version` pinning resolves to a tag ref that 404s.
  Releases would add version pinning, stable checksums for integrity
  verification, and a free `download_count` signal. The manifest indirection
  means swapping the target is a one-line change, no code edits.
- **Site/content duplication is unfixed.** Skills exist twice — in
  `.github/skills/<name>/SKILL.md` and `src/content/skills/<name>.md` — and are
  already drifting. The fix is Astro 5's `glob` loader pointed at
  `.github/skills`, deleting `src/content/skills/`. Renovate already has the
  Astro 5 PR open. Constraint: `validate-agent-skills.sh` greps for `name:`
  using `sed -n '2,10p'`, so new frontmatter keys must go *below* `name:`.

## Constraints worth remembering

- SWA Free: 1M function executions/month, 100GB bandwidth, **no SLA**. At
  ~1,400 installs/month that is ~0.1% of the allowance. Cost £0.
- **SWA managed functions do not support Managed Identity**, so a storage
  connection string is unavoidable. It lives only in app settings, never in the
  repo. This contradicts the repo's own "always use Managed Identity" guidance —
  a platform limitation, not a choice.
- SWA backends exist only in `westus2`, `centralus`, `eastus2`, `westeurope`,
  `eastasia`. `westeurope` is closest to the UK.
- GitHub traffic endpoints need push access; the default `GITHUB_TOKEN` often
  403s, so a fine-grained PAT with `Administration: Read-only` is needed. (Only
  relevant if the traffic metrics are ever revived.)

## Resuming

```bash
git checkout feat/site-and-metrics
npm ci --prefix api
npm test --prefix api                           # 8 pass, storage suite skipped
```

The two Table Storage tests skip unless Azurite is running. For the full 10:

```bash
npm run azurite --prefix api &                  # 127.0.0.1:10002
npm test --prefix api                           # 10 pass
```

Then likely order: deploy (`./infra/deploy.sh`) → point install docs at the
endpoint → publish the CLI to npm → add releases for pinning and integrity.

See `api/README.md` for the four local testing levels.
