# APM Manifest Patterns

Read this file when creating or reviewing `apm.yml` manifests. Covers full YAML examples for every pattern.

**Official schema reference:** https://microsoft.github.io/apm/

---

## Recommended Repo Layout

```
repo-root/
├── apm.yml                      # Root manifest — install everything at once
├── packages/
│   ├── architect/
│   │   ├── apm.yml
│   │   └── .apm/.gitkeep        # Required — APM writes install cache here
│   ├── terraform/
│   │   ├── apm.yml
│   │   └── .apm/.gitkeep
│   └── diagramming/
│       ├── apm.yml
│       └── .apm/.gitkeep
└── .github/
    ├── agents/
    └── skills/
```

---

## Pattern 1 — Single-Concern Package

One domain per package. This is the preferred pattern — packages stay focused and users can install only what they need.

```yaml
# packages/architect/apm.yml
name: azure-architect-skills
version: 1.0.0
description: >
  Azure architecture design, WAF/CAF assessment, and live pricing skills and
  agent for GitHub Copilot.
author: thomast1906
license: MIT
target: vscode

dependencies:
  apm:
    # Agents
    - thomast1906/github-copilot-agent-skills/.github/agents/azure-architect.agent.md
    # Skills
    - thomast1906/github-copilot-agent-skills/.github/skills/architecture-design
    - thomast1906/github-copilot-agent-skills/.github/skills/waf-assessment
    - thomast1906/github-copilot-agent-skills/.github/skills/azure-pricing
    # cost-optimization excluded — WIP
```

---

## Pattern 2 — Meta-Package (install multiple sub-packages)

A thin manifest that references other packages. Use at the repo root or to create "install all" bundles.

```yaml
# apm.yml (root)
name: github-copilot-agent-skills
version: 1.0.0
description: >
  Install all agents, skills, and MCP configs from this repo at once.
author: thomast1906
license: MIT
target: vscode

dependencies:
  apm:
    - thomast1906/github-copilot-agent-skills/packages/architect
    - thomast1906/github-copilot-agent-skills/packages/terraform
    - thomast1906/github-copilot-agent-skills/packages/diagramming
```

Users install everything with: `apm install thomast1906/github-copilot-agent-skills --runtime vscode`

---

## Pattern 3 — Package with MCP Dependencies

Add an `mcp:` block alongside `apm:` to inject server config into the target project's `.vscode/mcp.json`.

```yaml
# packages/diagramming/apm.yml
name: diagramming-skills
version: 1.0.0
description: >
  Draw.io and Excalidraw diagramming skills for GitHub Copilot, with MCP
  servers pre-configured.
author: thomast1906
license: MIT
target: vscode

dependencies:
  apm:
    - thomast1906/github-copilot-agent-skills/.github/skills/drawio-mcp-diagramming
    - thomast1906/github-copilot-agent-skills/.github/skills/azure-drawio-mcp-diagramming
    - thomast1906/github-copilot-agent-skills/.github/skills/excalidraw-mcp-diagramming
  mcp:
    - name: drawio
      registry: false
      transport: http
      url: "https://mcp.draw.io/mcp"
    - name: excalidraw
      registry: false
      transport: http
      url: "https://mcp.excalidraw.com"
```

---

## Manifest Field Reference

| Field | Required | Notes |
|---|---|---|
| `name` | Yes | kebab-case, unique across packages in the repo |
| `version` | Yes | semver — increment when adding/removing deps |
| `description` | Yes | One or two sentences; shown in `apm list` |
| `author` | Yes | GitHub username or org |
| `license` | Yes | SPDX identifier (e.g. `MIT`) |
| `target` | Recommended | `vscode` or `codex`; controls `apm compile` output. Always set `vscode` for VS Code projects. |
| `dependencies.apm` | Yes (at least one) | Full `owner/repo/path` virtual paths |
| `dependencies.mcp` | Optional | MCP server entries injected into `.vscode/mcp.json` |

### Virtual path syntax

APM paths are not file-system paths — they resolve against the GitHub repo at install time:

```yaml
# Agent file — full path to the .md file
- owner/repo/.github/agents/my-agent.agent.md

# Skill directory — APM installs the whole folder
- owner/repo/.github/skills/my-skill

# Sub-package — APM reads that package's apm.yml and installs its deps
- owner/repo/packages/sub-package
```

### WIP exclusion pattern

Comment out unstable content rather than deleting it, so it's easy to re-enable:

```yaml
dependencies:
  apm:
    - owner/repo/.github/agents/apim-policy-author.agent.md
    # Skills below are WIP — excluded until stable:
    # - owner/repo/.github/skills/api-security-review
    # - owner/repo/.github/skills/apim-policy-authoring
    # - owner/repo/.github/skills/azure-apim-architecture
    # - owner/repo/.github/skills/apiops-deployment
```
