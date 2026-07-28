#!/usr/bin/env node
/**
 * @thomast1906/skills
 *
 * This CLI contains no telemetry. Install counts are a server-side property of
 * the redirect at INSTALL_HOST — there is no beacon here to audit or disable.
 * `--from-github` skips the redirect entirely and fetches from GitHub direct.
 */

import { mkdtemp, rm, mkdir, cp, readdir } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve as resolvePath } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { createRequire } from 'node:module';
import * as tar from 'tar';

const require = createRequire(import.meta.url);
const { version: VERSION } = require('../package.json');

const INSTALL_HOST = process.env.SKILLS_INSTALL_HOST ?? 'https://skills.thomasthornton.cloud';
const REPO = 'thomast1906/github-copilot-agent-skills';
const UA = `thomast1906-skills-cli/${VERSION}`;

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
};

function parseArgs(argv) {
  const args = { _: [], flags: {} };
  for (const a of argv) {
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      args.flags[k] = v ?? true;
    } else {
      args._.push(a);
    }
  }
  return args;
}

async function fetchManifest() {
  const src = process.env.SKILLS_MANIFEST_URL
    ?? `https://raw.githubusercontent.com/${REPO}/main/api/src/shared/manifest.json`;

  if (!src.startsWith('http')) {
    const { readFile } = await import('node:fs/promises');
    return JSON.parse(await readFile(src, 'utf8'));
  }

  const res = await fetch(src, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`Could not load bundle manifest (${res.status})`);
  return res.json();
}

async function download(bundle, { fromGithub }) {
  const url = fromGithub
    ? `https://codeload.github.com/${REPO}/tar.gz/refs/heads/main`
    : `${INSTALL_HOST}/i/${bundle}`;

  const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
  if (!res.ok) {
    // The redirect host is a convenience, not a dependency. If it is cold or
    // down, fall back to GitHub rather than failing the install.
    if (!fromGithub) {
      console.error(c.dim(`  install host unavailable (${res.status}), falling back to GitHub`));
      return download(bundle, { fromGithub: true });
    }
    throw new Error(`Download failed (${res.status})`);
  }

  const dir = await mkdtemp(join(tmpdir(), 'thomas-skills-'));
  const file = join(dir, 'bundle.tgz');
  await pipeline(Readable.fromWeb(res.body), createWriteStream(file));
  return { dir, file };
}

async function install(bundleName, flags) {
  const manifest = await fetchManifest();
  const bundle = manifest.bundles[bundleName];

  if (!bundle) {
    console.error(c.red(`Unknown bundle '${bundleName}'`));
    console.error(`Available: ${Object.keys(manifest.bundles).join(', ')}`);
    process.exit(1);
  }

  const targetRoot = resolvePath(flags.dir ?? process.cwd());
  console.log(`${c.bold(bundleName)} ${c.dim(`v${bundle.version}`)}`);
  console.log(c.dim(`  ${bundle.skills.length} skills, ${bundle.agents.length} agents → ${targetRoot}`));

  const { dir, file } = await download(bundleName, { fromGithub: Boolean(flags['from-github']) });

  try {
    const extractDir = join(dir, 'x');
    await mkdir(extractDir, { recursive: true });

    // Archives are wrapped in a single top-level directory; strip it and keep
    // only the paths this bundle declares.
    await tar.x({
      file,
      cwd: extractDir,
      strip: 1,
      filter: (p) => bundle.target.include.some((inc) => p.includes(inc)),
    });

    for (const rel of bundle.target.include) {
      const from = join(extractDir, rel);
      const to = join(targetRoot, rel);
      await mkdir(join(to, '..'), { recursive: true });
      await cp(from, to, { recursive: true }).catch(() => {
        console.error(c.red(`  missing in archive: ${rel}`));
      });
      console.log(c.green(`  ✓ ${rel}`));
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }

  console.log(c.dim('\nRestart Copilot to pick up the new skills.'));
}

async function list() {
  const manifest = await fetchManifest();
  for (const [name, b] of Object.entries(manifest.bundles)) {
    console.log(`${c.bold(name.padEnd(16))} ${c.dim(`v${b.version}`)}`);
    for (const s of b.skills) console.log(`  ${c.dim('skill')} ${s}`);
    for (const a of b.agents) console.log(`  ${c.dim('agent')} ${a}`);
  }
}

function help() {
  console.log(`
${c.bold('@thomast1906/skills')} ${c.dim(`v${VERSION}`)}

  ${c.bold('add')} <bundle>     Install a bundle into ./.github/
  ${c.bold('list')}             Show available bundles

Options
  --dir=<path>       Install root (default: cwd)
  --from-github      Bypass the install host, fetch from GitHub directly

This CLI sends no telemetry. Install counts come from the redirect host;
--from-github skips it entirely.
`);
}

const { _: [cmd, arg], flags } = parseArgs(process.argv.slice(2));

try {
  if (cmd === 'add' && arg) await install(arg, flags);
  else if (cmd === 'list') await list();
  else help();
} catch (err) {
  console.error(c.red(`\n${err.message}`));
  process.exit(1);
}
