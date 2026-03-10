---
name: apm-setup
description: "Guides setting up APM (Agent Package Manager) in a repository — creating apm.yml manifests, structuring packages, using virtual path dependencies to avoid duplication, and testing locally. Use when configuring APM for a new or existing skills/agents repo."
---

# APM Setup Skill

Set up [APM (Agent Package Manager)](https://github.com/microsoft/apm) in a repository to make agents and skills installable by others with a single `apm install` command.

## When to Use

- Setting up APM in an existing agents/skills repository for the first time
- Structuring a monorepo with multiple installable scenarios (e.g. architect + terraform)
- Avoiding content duplication between `.github/` (live) and `.apm/` (distributed)
- Debugging a broken APM install or validating a package structure

---

## Core Concepts

### `.apm/` vs `.github/`

| Directory | Purpose |
|-----------|---------|
| `.apm/` | Source directory APM scans when others `apm install` from your repo. Valid subdirs: `agents/`, `instructions/`, `prompts/`, `skills/`, `context/`, `hooks/` |
| `.github/` | Where APM installs content into — the live directory VS Code/Copilot reads from |

If your repo **already has** agents and skills in `.github/`, use virtual path dependencies (Option B below) rather than copying files into `.apm/`.

### Valid `apm.yml` Fields

Only these fields are valid — do not invent others:

```yaml
name: my-package          # required
version: 1.0.0            # required
description: ...          # optional
target: vscode            # optional (default: vscode)
type: package             # optional
scripts: {}               # optional
dependencies:
  apm: []                 # list of APM package refs
  mcp: []                 # list of MCP server refs
compilation: {}           # optional
```

> **Never use** fields like `instructions:`, `prompts:`, `skills:`, `agents:`, `profiles:`, `scenarios:` — these do not exist in the APM spec.

---

## Option A — Content in `.apm/`

Use when starting from scratch (no existing `.github/` files).

```
my-repo/
├── apm.yml
└── .apm/
    ├── agents/
    │   └── my-agent.agent.md
    └── skills/
        └── my-skill/
            └── SKILL.md
```

```yaml
# apm.yml
name: my-package
version: 1.0.0
description: My agents and skills.
```

APM will auto-discover everything under `.apm/` — no explicit listing needed.

---

## Option B — Virtual Path Dependencies (no duplication)

Use when agents/skills already live in `.github/`. Reference them directly as dependencies — zero copying.

```
my-repo/
├── apm.yml                        # root bundle
├── packages/
│   ├── architect/
│   │   └── apm.yml                # thin manifest
│   └── terraform/
│       └── apm.yml                # thin manifest
└── .github/
    ├── agents/                    # source of truth
    └── skills/                    # source of truth
```

### Thin manifest example

```yaml
# packages/architect/apm.yml
name: azure-architect-skills
version: 1.0.0
description: Azure architecture skills for GitHub Copilot.
dependencies:
  apm:
    - owner/repo/.github/agents/azure-architect.agent.md
    - owner/repo/.github/skills/architecture-design
    - owner/repo/.github/skills/waf-assessment
```

### Root bundle example

```yaml
# apm.yml
name: my-full-skillpack
version: 1.0.0
description: All scenarios bundled.
dependencies:
  apm:
    - owner/repo/packages/architect
    - owner/repo/packages/terraform
```

### Required: empty `.apm/` directory

Every directory you reference as a package **must** contain a `.apm/` subdirectory, even if empty, or APM will reject it:

```bash
mkdir -p packages/architect/.apm
touch packages/architect/.apm/.gitkeep  # git needs a file to track the dir
```

---

## SKILL.md Frontmatter Rules

APM parses `SKILL.md` YAML frontmatter. A common failure is an unquoted `description` containing a colon followed by a space:

```yaml
# BREAKS — colon in unquoted scalar
description: Do things. compatibility: Requires Python 3.

# WORKS — quoted
description: "Do things. compatibility: Requires Python 3."
```

Always quote `description` values that contain `: `.

---

## Virtual Path Reference Formats

```yaml
dependencies:
  apm:
    # Individual agent file
    - owner/repo/.github/agents/my-agent.agent.md

    # Skill directory (installs entire dir)
    - owner/repo/.github/skills/my-skill

    # Sub-package (resolves its own apm.yml)
    - owner/repo/packages/my-scenario

    # Pinned to a branch
    - owner/repo/packages/my-scenario#main
```

---

## Local Testing

Test without pushing to GitHub using the `file://` protocol:

```bash
# Create a clean test directory
mkdir /tmp/apm-test && cd /tmp/apm-test

# Install from local path
apm install file:///absolute/path/to/your/repo/packages/architect

# Verify what was installed
find .github -type f | sort
```

This reads directly from disk — no commit or push required.

---

## Install Commands (published repo)

```bash
# Specific scenario
apm install owner/repo/packages/architect

# Pinned to a branch
apm install owner/repo/packages/architect#my-branch

# Root bundle (all scenarios)
apm install owner/repo
```

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Missing required directory: .apm/` | Package dir has no `.apm/` subdir | `mkdir packages/mypkg/.apm && touch packages/mypkg/.apm/.gitkeep` |
| `mapping values are not allowed in this context` | Unquoted colon in `SKILL.md` description | Wrap `description` value in double quotes |
| `(cached)` shown but old content used | APM is reading from local `apm_modules/` cache | Delete the `apm_modules/` dir in your test folder and reinstall |
| Skills/agents not loading in Copilot | Files installed but VS Code not refreshed | Reload VS Code window (`Cmd+Shift+P` → `Reload Window`) |
| `apm.yml` fields silently ignored | Used a non-existent field name | Only use: `name`, `version`, `description`, `target`, `type`, `scripts`, `dependencies`, `compilation` |
