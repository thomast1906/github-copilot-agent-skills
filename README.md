# GitHub Copilot Agent Skills

Production-focused GitHub Copilot agents and reusable skills for Azure architecture, Terraform workflows, API management, and diagramming.

Skills are instruction bundles automatically invoked by Copilot when a task matches their description. Agents are selectable Copilot Chat modes with a defined role, workflow, and tool access.

## Installation Options

| Goal | Recommended approach |
|---|---|
| Install curated bundles managed by manifests | [Use APM (`apm install`)](#install-with-apm) |
| Install from the published skills catalog | [Use Skills CLI (`npx skills add`)](#install-with-skills-cli) |
| Access all skills, including preview work | [Clone this repository](#clone-the-repository) |

## Install with APM

Install [APM (Agent Package Manager)](https://github.com/microsoft/apm):

```bash
# macOS / Linux
curl -sSL https://aka.ms/apm-unix | sh

# Windows PowerShell
irm https://aka.ms/apm-windows | iex
```

Install the curated root package:

```bash
apm install thomast1906/github-copilot-agent-skills --target copilot
```

Install individual bundles:

```bash
apm install thomast1906/github-copilot-agent-skills/packages/architect --target copilot
apm install thomast1906/github-copilot-agent-skills/packages/terraform --target copilot
apm install thomast1906/github-copilot-agent-skills/packages/diagramming --target copilot
apm install thomast1906/github-copilot-agent-skills/packages/drawio-mcp-diagramming --target copilot
```

APM deploys agents and MCP configuration to the selected target. Current APM versions deploy skills to `.agents/skills/` by default; use `--legacy-skill-paths` for client-specific directories such as `.github/skills/`.

## Install with Skills CLI

Use the published catalog on Skills:

- [skills.sh: `thomast1906/github-copilot-agent-skills`](https://www.skills.sh/thomast1906/github-copilot-agent-skills)

Install:

```bash
npx skills add thomast1906/github-copilot-agent-skills
```

## Curated Bundles

The root `apm.yml` installs the curated bundles below. It does not include every skill in this repository.

| Bundle | Included content | Requirements |
|---|---|---|
| `packages/architect` | `azure-architect` agent; `architecture-design`, `waf-assessment`, `azure-pricing` skills | Azure MCP |
| `packages/terraform` | `terraform-provider-upgrade` and `gh-aw-builder` agents; `terraform-module-creator`, `terraform-provider-upgrade` skills | Docker for Terraform MCP; Azure MCP for module creation |
| `packages/diagramming` | `drawio-mcp-diagramming`, `azure-drawio-mcp-diagramming`, `excalidraw-mcp-diagramming` skills | Draw.io and Excalidraw MCP servers configured by APM |
| `packages/drawio-mcp-diagramming` | Standalone `drawio-mcp-diagramming` skill | Draw.io MCP server configured by APM |

## Skills

Skills not included in a bundle are available when cloning the repository.

| Skill | Description | Included bundle |
|---|---|---|
| `architecture-design` | Designs Azure solutions from requirements, including service selection, WAF alignment, cost estimates, and HLD output. | `packages/architect` |
| `waf-assessment` | Assesses architectures against all five Azure Well-Architected Framework pillars with scored recommendations. | `packages/architect` |
| `azure-pricing` | Looks up live Azure retail pricing, estimates template costs, and compares regions and pricing types. | `packages/architect` |
| `terraform-module-creator` | Designs maintainable Terraform modules from infrastructure requirements with Azure-focused patterns. | `packages/terraform` |
| `terraform-provider-upgrade` | Guides provider upgrades, breaking-change analysis, resource migration (`moved` blocks), and validation. | `packages/terraform` |
| `drawio-mcp-diagramming` | Creates and edits Draw.io diagrams with Azure2 and AWS4 icon guidance. | `packages/diagramming`, `packages/drawio-mcp-diagramming` |
| `azure-drawio-mcp-diagramming` | Creates and edits Azure-focused Draw.io diagrams with reliable icon rendering guidance. | `packages/diagramming` |
| `excalidraw-mcp-diagramming` | Creates and edits live Excalidraw canvases and exports to PNG, SVG, `.excalidraw`, or a shareable URL. | `packages/diagramming` |
| `skill-creator` | Creates, updates, reviews, and validates GitHub Copilot `SKILL.md` files. | - |
| `apm-package-author` | Creates and troubleshoots APM manifests for skills, agents, and MCP server packaging. | - |
| `gh-aw-operations` | Creates, compiles, debugs, and manages GitHub Agentic Workflows (`gh-aw`). | - |

## Preview Skills

These skills are under active development and are currently available by cloning the repository.

| Skill | Description |
|---|---|
| `cost-optimization` | Identifies Azure cost reduction opportunities and estimates savings and ROI. |
| `azure-apim-architecture` | Analyzes Azure API Management topology, networking, environment strategy, and cost trade-offs. |
| `apim-policy-authoring` | Generates APIM policy XML for authentication, rate limiting, CORS, error handling, and transformations. |
| `api-security-review` | Reviews APIM configurations against OWASP API Security Top 10 and Azure security guidance. |
| `apiops-deployment` | Guides APIM deployments with Bicep or Terraform and CI/CD promotion workflows. |

## Agents

Select these from the Copilot Chat agent picker for guided, role-specific workflows.

| Agent file | Agent | Description | Availability |
|---|---|---|---|
| `azure-architect.agent.md` | Azure Architect Agent | Designs Azure architectures and produces HLD documents aligned to WAF and CAF. | `packages/architect` |
| `terraform-provider-upgrade.agent.md` | Terraform Provider Upgrade | Performs structured Terraform provider upgrades and compatibility validation. | `packages/terraform` |
| `gh-aw-builder.agent.md` | GitHub Agentic Workflow Builder | Creates markdown-based GitHub Agentic Workflows with frontmatter, MCP wiring, and safe outputs. | `packages/terraform` |
| `apim-policy-author.agent.md` | APIM Policy Author | Generates Azure API Management policy XML for authentication, rate limiting, CORS, error handling, and transformations. | Repository only |

## Requirements

- VS Code or VS Code Insiders
- [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) with Copilot Chat enabled

### MCP Servers

Some skills require MCP servers for live data or interactive editing. APM configures the MCP servers declared in package manifests. This repository also includes [`.vscode/mcp.json`](.vscode/mcp.json) for clone-based usage.

| MCP server | Used by | Setup |
|---|---|---|
| Azure MCP | `architecture-design`, `waf-assessment`, `azure-pricing`, `cost-optimization`, `terraform-module-creator` | Install [Azure Tools](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azure-github-copilot). The server registers automatically. |
| Draw.io MCP | `drawio-mcp-diagramming`, `azure-drawio-mcp-diagramming` | Configured automatically by relevant APM bundles or the included `.vscode/mcp.json`. |
| Excalidraw MCP | `excalidraw-mcp-diagramming` | Configured automatically by `packages/diagramming` or the included `.vscode/mcp.json`. |
| Terraform MCP | `terraform-provider-upgrade`, `terraform-module-creator` | Configured automatically by `packages/terraform` or the included `.vscode/mcp.json`. Requires Docker. HCP Terraform or Terraform Enterprise credentials are optional for public registry use. |

## Clone the Repository

1. Clone or fork this repository.
2. Open the repository in VS Code with Copilot Chat enabled.
3. Start any MCP servers required by the skills you plan to use.
4. Select an agent from the Copilot Chat agent picker, or invoke a skill explicitly, for example: `Use the waf-assessment skill to review this architecture.`

## Repository Layout

```text
.github/
├── agents/                   # Selectable GitHub Copilot Chat agents
├── skills/                   # Stable and preview skill directories
├── scripts/                  # Repository validation scripts
└── workflows/                # CI validation
packages/
├── architect/                # Azure architecture APM bundle
├── terraform/                # Terraform APM bundle
├── diagramming/              # Complete diagramming APM bundle
└── drawio-mcp-diagramming/   # Standalone Draw.io APM bundle
apm.yml                       # Root curated APM package
```

## Contributing

Each skill is located at `.github/skills/<skill-name>/` and includes a `SKILL.md` defining purpose, trigger description, workflow, and tool guidance. Supporting references belong in `references/`, and reusable helpers belong in `scripts/`.

Before opening a pull request, run:

```bash
./.github/scripts/validate-agent-skills.sh
```
