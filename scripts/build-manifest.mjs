#!/usr/bin/env node
/**
 * Builds api/src/shared/manifest.json from packages/<bundle>/apm.yml.
 *
 * The manifest is the indirection layer that keeps the redirect function off
 * the hot-path network: bundle -> version + download target is resolved from
 * memory, never from the GitHub API (60 req/hr unauthenticated would break
 * installs within the hour).
 *
 * It also means the download target is data, not code. Switching from repo
 * archives to release assets later is a change here, with no edits to the
 * function or the CLI.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = process.cwd();
const REPO = process.env.MANIFEST_REPO ?? 'thomast1906/github-copilot-agent-skills';
const REF = process.env.MANIFEST_REF ?? 'main';
const OUT = process.env.MANIFEST_OUT ?? 'api/src/shared/manifest.json';

/** Minimal reader for the flat `dependencies.apm` list used by apm.yml. */
function parseApm(yaml) {
  const out = { name: null, version: null, description: null, deps: [] };
  let inDeps = false;

  for (const raw of yaml.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (/^name:/.test(line)) out.name = line.replace(/^name:\s*/, '').trim();
    if (/^version:/.test(line)) out.version = line.replace(/^version:\s*/, '').trim().replace(/^["']|["']$/g, '');

    if (/^\s{2}apm:\s*$/.test(line)) { inDeps = true; continue; }
    // Any other top-level or second-level key ends the apm list.
    if (inDeps && /^\s{0,2}\w/.test(line)) inDeps = false;
    if (inDeps) {
      const m = line.match(/^\s*-\s*(\S+)/);
      if (m) out.deps.push(m[1]);
    }
  }
  return out;
}

const packagesDir = join(ROOT, 'packages');
const bundles = {};

for (const slug of readdirSync(packagesDir)) {
  const manifestPath = join(packagesDir, slug, 'apm.yml');
  if (!existsSync(manifestPath)) continue;

  const parsed = parseApm(readFileSync(manifestPath, 'utf8'));

  const skills = [];
  const agents = [];
  for (const dep of parsed.deps) {
    const skill = dep.match(/\/\.github\/skills\/([^/]+)$/);
    if (skill) { skills.push(skill[1]); continue; }
    const agent = dep.match(/\/\.github\/agents\/(.+)$/);
    if (agent) agents.push(agent[1]);
  }

  bundles[slug] = {
    package: parsed.name,
    version: parsed.version ?? '0.0.0',
    skills,
    agents,
    // Repo archive: no release required. Swap to a release asset URL to gain
    // version pinning and stable checksums.
    target: {
      type: 'archive',
      ref: REF,
      url: `https://codeload.github.com/${REPO}/tar.gz/refs/heads/${REF}`,
      // Paths the CLI extracts from the archive.
      include: [
        ...skills.map((s) => `.github/skills/${s}`),
        ...agents.map((a) => `.github/agents/${a}`),
      ],
    },
  };
}

const manifest = {
  generatedAt: new Date().toISOString(),
  repo: REPO,
  bundles,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Wrote ${OUT}`);
for (const [slug, b] of Object.entries(bundles)) {
  console.log(`  ${slug.padEnd(24)} v${b.version}  ${b.skills.length} skills, ${b.agents.length} agents`);
}
