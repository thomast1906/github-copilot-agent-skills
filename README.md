# GitHub Copilot Agent Skillst

[![skills.sh](https://skills.sh/b/thomast1906/github-copilot-agent-skills)](https://www.skills.sh/thomast1906/github-copilot-agent-skills) Only added 28/07/2026 - stats will be low until engagement follows this :)

A curated collection of reusable agent skills and GitHub Copilot Chat agents covering Azure architecture, API Management, Terraform, diagramming, GitHub Agentic Workflows, and skill authoring. Each skill encapsulates engineering guidance and structured workflows so you do not have to restate context in every chat session.

Install the full curated collection with APM, pick an individual skill through the skills CLI, or clone the repository to explore everything including work in progress.

---

## Browse the skills

The repository is indexed at **[skills.sh/thomast1906/github-copilot-agent-skills](https://www.skills.sh/thomast1906/github-copilot-agent-skills)**, where you can browse individual skills, view their descriptions, and see skills.sh-specific installation statistics. Note that the skills.sh counters reflect installs made through the skills.sh platform and CLI; they do not include APM installations, Git clones, or manual copies.

For the full source, examples, scripts, history, and contribution process, this GitHub repository remains the canonical reference.

---

## Installation

### Prerequisites

- VS Code or VS Code Insiders with [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) and GitHub Copilot Chat enabled.
- For APM installs: [APM (Agent Package Manager)](https://github.com/microsoft/apm).

```bash
# macOS / Linux
curl -sSL https://aka.ms/apm-unix | sh

# Windows PowerShell
irm https://aka.ms/apm-windows | iex
```

---

### Option 1 — skills CLI (browse or install individual skills)

Use the skills CLI when you want to browse the catalogue or install a single skill without pulling in a full bundle.

```bash
npx skills add thomast1906/github-copilot-agent-skills
```

---

### Option 2 — APM (curated packages with declared dependencies)

APM installs skills, agents, and MCP server configuration together. The root package pulls in all curated bundles. Use APM when you want a reproducible, manifest-driven install.

**Install the full curated collection:**

```bash
apm install thomast1906/github-copilot-agent-skills
```

**Install an individual bundle:**

```bash
apm install thomast1906/github-copilot-agent-skills/packages/architect
apm install thomast1906/github-copilot-agent-skills/packages/terraform
apm install thomast1906/github-copilot-agent-skills/packages/diagramming
apm install thomast1906/github-copilot-agent-skills/packages/drawio-mcp-diagramming
```

APM deploys agents and MCP configuration to the selected target. By default, skills are placed in `.agents/skills/`. Use `--legacy-skill-paths` if you need per-client directories such as `.github/skills/`.

---

### Option 3 — Clone the repository

Clone or fork the repository to access every skill, including work in progress, and to contribute changes.

```bash
git clone https://github.com/thomast1906/github-copilot-agent-skills.git
```

Open the folder in VS Code, ensure GitHub Copilot Chat is enabled, and start the MCP servers relevant to the skills you plan to use (see [MCP servers](#mcp-servers) below). Then invoke a skill explicitly:

```
Use the waf-assessment skill to review this architecture.
```

Or select an agent from the GitHub Copilot Chat agent picker.

---

## Available skills

Skills are grouped below by area. Stable skills are included in an APM bundle; work-in-progress skills are available by cloning the repository.

### Azure Architecture

| Skill | Description | APM bundle |
|---|---|---|
| [`architecture-design`](.github/skills/architecture-design) | Designs Azure cloud architectures from requirements, produces HLD documentation, selects services, and aligns to WAF and CAF. | `packages/architect` |
| [`waf-assessment`](.github/skills/waf-assessment) | Assesses an architecture against the five Azure Well-Architected Framework pillars and provides scored recommendations. | `packages/architect` |
| [`azure-pricing`](.github/skills/azure-pricing) | Looks up live Azure retail pricing for any SKU or region, estimates template costs, and compares pricing types. | `packages/architect` |
| [`cost-optimization`](.github/skills/cost-optimization) | Analyses Azure architectures for cost reduction opportunities and estimates savings and ROI. *(work in progress)* | — |

### Azure API Management

| Skill | Description | APM bundle |
|---|---|---|
| [`azure-apim-architecture`](.github/skills/azure-apim-architecture) | Analyses APIM topology, networking, multi-environment strategy, and cost trade-offs. *(work in progress)* | — |
| [`apim-policy-authoring`](.github/skills/apim-policy-authoring) | Generates production-ready APIM policy XML for authentication, rate limiting, CORS, error handling, and transformations. *(work in progress)* | — |
| [`api-security-review`](.github/skills/api-security-review) | Reviews APIM configurations against OWASP API Security Top 10, VNet Internal mode, Private Link, and Azure Security Benchmark. *(work in progress)* | — |
| [`apiops-deployment`](.github/skills/apiops-deployment) | Guides APIM infrastructure deployment with Bicep or Terraform and CI/CD promotion workflows. *(work in progress)* | — |

### Terraform and Infrastructure as Code

| Skill | Description | APM bundle |
|---|---|---|
| [`terraform-module-creator`](.github/skills/terraform-module-creator) | Designs maintainable Terraform modules from real infrastructure requirements using Azure-focused patterns. | `packages/terraform` |
| [`terraform-provider-upgrade`](.github/skills/terraform-provider-upgrade) | Guides safe Terraform provider upgrades: breaking-change detection, resource migration with `moved` blocks, and validation. | `packages/terraform` |

### Diagramming

| Skill | Description | APM bundle |
|---|---|---|
| [`drawio-mcp-diagramming`](.github/skills/drawio-mcp-diagramming) | Creates and edits architecture diagrams via the Draw.io MCP server with Azure2 and AWS4 icon library support. | `packages/diagramming`, `packages/drawio-mcp-diagramming` |
| [`azure-drawio-mcp-diagramming`](.github/skills/azure-drawio-mcp-diagramming) | Creates and edits Azure-focused Draw.io diagrams with reliable Azure icon rendering guidance. | `packages/diagramming` |
| [`excalidraw-mcp-diagramming`](.github/skills/excalidraw-mcp-diagramming) | Creates and edits diagrams on a live Excalidraw canvas; exports to PNG, SVG, `.excalidraw`, or a shareable URL. | `packages/diagramming` |

### GitHub and Agentic Workflows

| Skill | Description | APM bundle |
|---|---|---|
| [`gh-aw-operations`](.github/skills/gh-aw-operations) | Creates, compiles, debugs, and manages GitHub Agentic Workflows with proper frontmatter, MCP wiring, and safe outputs. | — |

### Skill and Package Authoring

| Skill | Description | APM bundle |
|---|---|---|
| [`skill-creator`](.github/skills/skill-creator) | Creates, updates, reviews, and validates GitHub Copilot `SKILL.md` files. | — |
| [`apm-package-author`](.github/skills/apm-package-author) | Creates and troubleshoots APM manifests for distributing skills, agents, and MCP server configuration. | — |

### Agents

Select an agent from the GitHub Copilot Chat agent picker for a guided, role-specific workflow.

| Agent | What it does | APM bundle |
|---|---|---|
| [`azure-architect`](.github/agents/azure-architect.agent.md) | Designs Azure architectures and produces HLD documents aligned to WAF and CAF. | `packages/architect` |
| [`terraform-provider-upgrade`](.github/agents/terraform-provider-upgrade.agent.md) | Performs structured Terraform provider upgrades and compatibility validation. | `packages/terraform` |
| [`gh-aw-builder`](.github/agents/gh-aw-builder.agent.md) | Creates markdown-based GitHub Agentic Workflows with frontmatter, MCP wiring, and safe outputs. | `packages/terraform` |
| [`apim-policy-author`](.github/agents/apim-policy-author.agent.md) | Generates Azure API Management policy XML for authentication, rate limiting, CORS, and error handling. | Repository only |

---

## Recommended usage

| Goal | Recommended approach |
|---|---|
| Browse or install a single skill | skills CLI: `npx skills add thomast1906/github-copilot-agent-skills` |
| Reproducible install of a full bundle with MCP configuration | APM: `apm install thomast1906/github-copilot-agent-skills` |
| Review source, examples, history, or contribution process | Clone this repository |

---

## MCP servers

Some skills call MCP servers for live data or diagram editing. APM configures the MCP servers bundled in package manifests automatically. Direct clones can use the included [`.vscode/mcp.json`](.vscode/mcp.json).

| MCP server | Used by | Setup |
|---|---|---|
| Azure MCP | `architecture-design`, `waf-assessment`, `azure-pricing`, `cost-optimization`, `terraform-module-creator` | Install the [Azure Tools](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azure-github-copilot) VS Code extension; the server registers automatically. |
| Draw.io MCP | `drawio-mcp-diagramming`, `azure-drawio-mcp-diagramming` | Configured automatically by the relevant APM bundles or the included `.vscode/mcp.json`. |
| Excalidraw MCP | `excalidraw-mcp-diagramming` | Configured automatically by `packages/diagramming` or the included `.vscode/mcp.json`. |
| Terraform MCP | `terraform-provider-upgrade`, `terraform-module-creator` | Configured automatically by `packages/terraform` or the included `.vscode/mcp.json`. Requires Docker. HCP Terraform or Terraform Enterprise credentials are optional for public registry use. |

---

## Repository structure

```text
.github/
├── agents/                    # Selectable GitHub Copilot Chat agents
├── skills/                    # Skill directories (stable and work in progress)
├── scripts/                   # Repository validation scripts
└── workflows/                 # CI validation workflows
packages/
├── architect/                 # Azure architecture APM bundle
├── terraform/                 # Terraform APM bundle
├── diagramming/               # Complete diagramming APM bundle
└── drawio-mcp-diagramming/    # Standalone Draw.io APM bundle
apm.yml                        # Root curated APM package manifest
```

---

## Creating or contributing a skill

Each skill lives under `.github/skills/<skill-name>/` and requires a `SKILL.md` file that contains its purpose, trigger description, step-by-step workflow, and tool guidance. Supporting references belong in a `references/` subdirectory. Reusable helpers belong in `.github/scripts/`.

To contribute a new skill or improve an existing one:

1. Fork the repository and create a branch.
2. Add or update the skill directory under `.github/skills/`.
3. Run the format validation script before opening a pull request:

   ```bash
   ./.github/scripts/validate-agent-skills.sh
   ```

4. Open a pull request — the [`validate-skills`](.github/workflows/validate-skills.yaml) GitHub Actions workflow runs the same check on every push and pull request touching `.github/skills/`.

The [`skill-creator`](.github/skills/skill-creator) skill itself can assist you in drafting a new `SKILL.md`. The [`apm-package-author`](.github/skills/apm-package-author) skill can help you create or troubleshoot an `apm.yml` manifest if you want to package a skill for distribution.

---

## Licence

This repository is licensed under the [MIT Licence](https://opensource.org/licenses/MIT).
