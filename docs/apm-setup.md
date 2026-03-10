# APM Setup — Full Reference

Everything learned setting up [APM (Agent Package Manager)](https://github.com/microsoft/apm) in this repository, including pitfalls, corrections, and the final working structure.

---

## What APM Is

APM is a package manager by Microsoft that lets you publish and install GitHub Copilot agents, skills, and instructions. Others can `apm install owner/repo` to pull your agents and skills directly into their `.github/` folder without copying files manually.

---

## Key Directories

| Directory | Role |
|-----------|------|
| `.github/agents/` | Where APM **installs** agent files. Also the live directory VS Code/Copilot reads. |
| `.github/skills/` | Where APM **installs** skill directories. Also the live directory VS Code/Copilot reads. |
| `.apm/` | Source directory APM **scans** when someone installs *from* your repo. Valid subdirs: `agents/`, `instructions/`, `prompts/`, `skills/`, `context/`, `hooks/` |
| `packages/` | Monorepo scenario sub-packages. Each has its own `apm.yml` and an empty `.apm/` dir. |

---

## The Two Setup Options

### Option A — Content in `.apm/` (copy-based)

Put your agents and skills under `.apm/` in the repo root. APM auto-discovers them on install.

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

**When to use:** Starting fresh with no existing `.github/` content.

---

### Option B — Virtual Path Dependencies (this repo's approach)

If agents and skills already live in `.github/`, reference them as dependencies directly — no copying, no duplication. This is what this repo does.

```
my-repo/
├── apm.yml                        ← root bundle
├── packages/
│   ├── architect/
│   │   ├── apm.yml                ← thin manifest (no content)
│   │   └── .apm/                  ← required empty dir
│   │       └── .gitkeep
│   └── terraform/
│       ├── apm.yml
│       └── .apm/
│           └── .gitkeep
└── .github/
    ├── agents/                    ← source of truth
    └── skills/                    ← source of truth
```

**Why the empty `.apm/` dir?**  
APM validates that a directory is a valid package by checking for `.apm/` inside it. Without it you get:
```
❌ Subdirectory is not a valid APM package: Missing required directory: .apm/
```

---

## Valid `apm.yml` Fields

Only these fields exist. Using anything else is silently ignored.

```yaml
name: my-package          # required
version: 1.0.0            # required
description: ...          # optional — quote if value contains ": "
target: vscode            # optional
type: package             # optional
scripts: {}               # optional
dependencies:
  apm: []                 # list of APM package/path refs
  mcp: []                 # list of MCP server refs
compilation: {}           # optional
```

**Fields that do NOT exist** (common hallucinations from AI tools):
- `instructions:`, `prompts:`, `skills:`, `agents:` — not valid
- `profiles:`, `scenarios:`, `groups:` — not valid
- Nested `agents:` blocks to group scenarios — not valid

---

## This Repo's Package Manifests

### Root bundle — `apm.yml`

Installs all scenarios at once:

```yaml
name: github-copilot-agent-skills
version: 1.0.0
description: >
  Full Azure agent skill pack — architecture design, WAF/CAF, cost optimisation,
  API Management, Terraform, and deployment workflows for GitHub Copilot.
dependencies:
  apm:
    - thomast1906/github-copilot-agent-skills/packages/architect
    - thomast1906/github-copilot-agent-skills/packages/terraform
    - thomast1906/github-copilot-agent-skills/.github/skills/apm-setup
```

### Architect scenario — `packages/architect/apm.yml`

```yaml
name: azure-architect-skills
version: 1.0.0
description: >
  Azure architecture design, WAF/CAF assessment, cost optimisation,
  and API Management skills for GitHub Copilot.
dependencies:
  apm:
    - thomast1906/github-copilot-agent-skills/.github/agents/azure-architect.agent.md
    - thomast1906/github-copilot-agent-skills/.github/agents/apim-policy-author.agent.md
    - thomast1906/github-copilot-agent-skills/.github/skills/architecture-design
    - thomast1906/github-copilot-agent-skills/.github/skills/waf-assessment
    - thomast1906/github-copilot-agent-skills/.github/skills/cost-optimization
    - thomast1906/github-copilot-agent-skills/.github/skills/api-security-review
    - thomast1906/github-copilot-agent-skills/.github/skills/apim-policy-authoring
    - thomast1906/github-copilot-agent-skills/.github/skills/azure-apim-architecture
    - thomast1906/github-copilot-agent-skills/.github/skills/drawio-mcp-diagramming
```

### Terraform scenario — `packages/terraform/apm.yml`

```yaml
name: terraform-deployer-skills
version: 1.0.0
description: >
  Terraform provider upgrades, IaC deployment, APIOps, and GitHub
  Agentic Workflow skills for GitHub Copilot.
dependencies:
  apm:
    - thomast1906/github-copilot-agent-skills/.github/agents/terraform-provider-upgrade.agent.md
    - thomast1906/github-copilot-agent-skills/.github/agents/gh-aw-builder.agent.md
    - thomast1906/github-copilot-agent-skills/.github/skills/terraform-provider-upgrade
    - thomast1906/github-copilot-agent-skills/.github/skills/apiops-deployment
    - thomast1906/github-copilot-agent-skills/.github/skills/gh-aw-operations
```

---

## Virtual Path Reference Formats

```yaml
dependencies:
  apm:
    # Individual agent file
    - owner/repo/.github/agents/my-agent.agent.md

    # Skill directory (installs the entire dir)
    - owner/repo/.github/skills/my-skill

    # Sub-package (APM resolves its own apm.yml recursively)
    - owner/repo/packages/my-scenario

    # Pinned to a specific branch
    - owner/repo/packages/my-scenario#my-branch
```

---

## SKILL.md Frontmatter Gotcha

APM parses the YAML frontmatter of `SKILL.md`. If `description` contains a colon followed by a space (`": "`) in an unquoted value, YAML parsing fails:

```yaml
# BREAKS — unquoted colon in scalar
description: Do things. compatibility: Requires Python 3.

# WORKS — quoted
description: "Do things. compatibility: Requires Python 3."
```

Error message when this happens:
```
❌ Failed to process SKILL.md: mapping values are not allowed in this context
   in "<unicode string>", line 3, column N
```

Fix: wrap the `description` value in double quotes.

---

## Testing Locally (from disk, no push needed)

```bash
# Create a clean test directory
mkdir /tmp/apm-test && cd /tmp/apm-test

# Install from local path using file:// protocol
apm install file:///Users/thomasthornton/Documents/GitHub/thomast1906/github-copilot-agent-skills/packages/architect

# Or test the full bundle
apm install file:///Users/thomasthornton/Documents/GitHub/thomast1906/github-copilot-agent-skills

# Verify what was installed
find .github -type f | sort
```

> **Important:** Local `file://` installs still resolve virtual path dependencies from GitHub (not from local disk). So `.github/` dependencies like `thomast1906/github-copilot-agent-skills/.github/skills/...` are fetched from the **remote repo**. Local testing is only truly end-to-end if those paths are pushed.

---

## Testing from a Remote Branch

To test changes on a branch before merging to main, append `#branch-name` to the install path:

```bash
mkdir /tmp/apm-test && cd /tmp/apm-test

# Test the architect package from your feature branch
apm install thomast1906/github-copilot-agent-skills/packages/architect#feature/microsoft-apim-setup

# Test the terraform package from your feature branch
apm install thomast1906/github-copilot-agent-skills/packages/terraform#feature/microsoft-apim-setup

# Test the root bundle from your feature branch
apm install thomast1906/github-copilot-agent-skills#feature/microsoft-apim-setup

# Verify installed files
find .github -type f | sort
```

The `#branch-name` suffix applies to the top-level package. Dependencies listed inside that package's `apm.yml` without an explicit branch pin will resolve from their default branch. To force all virtual path deps to also come from your branch, pin them explicitly:

```yaml
dependencies:
  apm:
    - thomast1906/github-copilot-agent-skills/.github/skills/architecture-design#feature/microsoft-apim-setup
```

---

## The `(cached)` Problem

When you run multiple installs into the same test directory, APM caches fetched repos in `apm_modules/` inside that directory. Subsequent runs show `(cached)` and serve the old content even after you push fixes.

**Fix:** always use a fresh directory for each test run:

```bash
rm -rf /tmp/apm-test && mkdir /tmp/apm-test && cd /tmp/apm-test
apm install thomast1906/github-copilot-agent-skills/packages/architect#feature/microsoft-apim-setup
```

---

## Common Errors Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `Missing required directory: .apm/` | Package dir has no `.apm/` subdir | `mkdir packages/mypkg/.apm && touch packages/mypkg/.apm/.gitkeep` |
| `mapping values are not allowed in this context` | Unquoted colon in `SKILL.md` description | Wrap description in double quotes |
| Skills/agents show `(cached)` but old version | `apm_modules/` cache in test dir | Delete test dir and start fresh |
| Skills not loading in Copilot after install | VS Code hasn't re-read `.github/` | Reload VS Code window (`Cmd+Shift+P → Reload Window`) |
| `apm.yml` fields silently ignored | Used a non-existent field name | Only use: `name`, `version`, `description`, `target`, `type`, `scripts`, `dependencies`, `compilation` |
| Virtual deps resolve from wrong branch | Branch not pinned on dependency entries | Append `#branch-name` to each dependency ref that needs it |
