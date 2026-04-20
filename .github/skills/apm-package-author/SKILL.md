---
name: apm-package-author
description: 'Create, maintain, and troubleshoot APM (Agent Package Manager) manifests for distributing GitHub Copilot skills, agents, and MCP servers. USE FOR: creating apm.yml root manifests; creating packages/* sub-manifests; bundling MCP server config into a package; installing packages from a GitHub repo; troubleshooting APM install errors (missing .vscode/mcp.json, Codex CLI warnings, cached installs). DO NOT USE FOR: general GitHub Copilot customization questions; creating SKILL.md files (use skill-creator); writing MCP server code.'
argument-hint: 'Describe what you want to package or install, e.g. "set up APM for my skills repo" or "add MCP to my terraform package"'
---

# APM Package Author

APM ([docs](https://microsoft.github.io/apm/) · [GitHub](https://github.com/microsoft/apm)) distributes GitHub Copilot skills, agents, and MCP servers as versioned packages installable with one command. Use this skill to create manifests, wire MCP dependencies, or troubleshoot installs.

## When to Use

Use this skill when you need to:

- Create or update an `apm.yml` root manifest or `packages/*` sub-manifest for a GitHub Copilot skills/agents repository
- Bundle MCP server configuration into an APM package so consumers get MCP wired automatically on install
- Install a package from a GitHub repo using the APM CLI
- Troubleshoot APM install failures (missing `.vscode/mcp.json`, Codex CLI warnings, 404 errors, cached installs)

Do **not** use this skill for:
- General GitHub Copilot customization questions (use default agent)
- Creating `SKILL.md` files (use the `skill-creator` skill)
- Writing MCP server implementation code

Identify which task applies and jump to that section:

- **Creating packages for a repo** → [Package Creation Workflow](#package-creation-workflow)
- **Installing a package into a project** → [Install Commands](#install-commands)
- **Something went wrong** → [Troubleshooting](#troubleshooting)
- **Detailed YAML reference** → [references/manifest-patterns.md](references/manifest-patterns.md)
- **MCP transport details** → [references/mcp-config.md](references/mcp-config.md)

---

## Package Creation Workflow

### 1. Install APM CLI (if not already installed)

```bash
curl -sSL https://aka.ms/apm-unix | sh   # macOS / Linux
irm https://aka.ms/apm-windows | iex     # Windows (PowerShell)
```

Verify: `apm --version`

### 2. Decide the package structure

Choose based on how consumers will install:

| Pattern | When to use |
|---|---|
| **Single-concern package** `packages/<topic>/apm.yml` | One cohesive domain (e.g. terraform, diagramming, architect). Preferred. |
| **Meta-package** | One package references other packages — lets users `apm install` everything at once. Good for a repo root `apm.yml`. |

For a typical skills repo, use one `packages/<name>/` per domain plus a root `apm.yml` that pulls them all in. Read [references/manifest-patterns.md](references/manifest-patterns.md) for complete YAML examples of both patterns.

### 3. Scaffold each package directory

```bash
mkdir -p packages/<name>/.apm
touch packages/<name>/.apm/.gitkeep   # APM writes its install cache here — directory must exist
```

The `.apm/.gitkeep` placeholder is mandatory — without the directory APM may fail to write the install cache.

### 4. Write the `apm.yml` manifest

Minimum required fields:

```yaml
name: my-package-name     # kebab-case, must be unique
version: 1.0.0
description: >
  One sentence describing what this bundle installs.
author: github-username
license: MIT
target: vscode            # always set for VS Code projects

dependencies:
  apm:
    - owner/repo/.github/agents/my-agent.agent.md
    - owner/repo/.github/skills/my-skill
```

Key rules:
- All `apm:` paths must be full `owner/repo/...` virtual paths — relative paths do not work.
- Exclude any skills marked 🚧 WIP. Comment them out with a reason so they're easy to re-add later: `# cost-optimization excluded — WIP`
- Agents can still be included even when their companion skills are WIP.
- `target: vscode` controls `apm compile` output format only — it does NOT suppress Codex CLI warnings about HTTP MCP servers (those are cosmetic; the install still succeeds).

If skills require MCP servers, add an `mcp:` block. Read [references/mcp-config.md](references/mcp-config.md) for transport types, Docker examples, and the Azure MCP exception.

### 5. Update the root `apm.yml`

Add the new package to the root manifest so `apm install owner/repo` installs everything:

```yaml
dependencies:
  apm:
    - owner/repo/packages/my-new-package
    - owner/repo/packages/existing-package
```

### 6. Test the install

```bash
mkdir -p /tmp/apm-test/.vscode
cd /tmp/apm-test
apm install owner/repo/packages/<name>#your-branch --runtime vscode
```

Verify that `.vscode/mcp.json` was created (if the package has MCP deps) and that skills/agents landed in `.github/`. Then clean up:

```bash
rm -rf /tmp/apm-test
```

---

## Install Commands

### Standard install (VS Code project)

```bash
cd your-project
mkdir -p .vscode          # required if 'code' is not on your PATH
apm install owner/repo/packages/<name> --runtime vscode
```

`--runtime vscode` tells APM to write `.vscode/mcp.json` even if VS Code isn't detected. Without it APM looks for `code` on PATH or an existing `.vscode/` directory — if neither exists, MCP config is silently skipped.

### Install from a specific branch

```bash
apm install owner/repo/packages/<name>#branch-name --runtime vscode
```

### Force re-fetch (bypass cache)

```bash
apm install owner/repo/packages/<name> --update --runtime vscode
```

### Install everything from a repo

```bash
apm install owner/repo --runtime vscode   # uses root apm.yml
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `.vscode/mcp.json` not created | No `.vscode/` dir and `code` not on PATH | `mkdir -p .vscode` then re-run, or add `--runtime vscode` |
| Codex CLI warnings about HTTP MCP servers | Codex is stdio-only; HTTP transports are incompatible with it | Cosmetic — install still succeeds. `target: vscode` does not suppress this. |
| 404 / package not found | Wrong path or branch not pushed to remote | Check path matches directory name exactly; confirm branch is pushed |
| Stale / cached install | APM caches installs locally | Add `--update` to force re-fetch |
| `apm compile` output wrong format | Missing `target:` field | Add `target: vscode` to the manifest |
| Skills installed but not appearing in Copilot | `.github/` location not registered in `copilot-instructions.md` | Ensure the project's `copilot-instructions.md` references the skills directory |

---

## New Package Checklist

- [ ] `packages/<name>/apm.yml` created with all required fields and `target: vscode`
- [ ] `packages/<name>/.apm/.gitkeep` created and committed
- [ ] All `apm:` deps use full `owner/repo/...` virtual paths
- [ ] WIP skills excluded and commented out with reason
- [ ] `mcp:` block added if any skills require MCP servers
- [ ] Root `apm.yml` updated to reference the new package
- [ ] Tested with `--runtime vscode` in a clean temp directory
- [ ] Branch pushed to remote before testing install
