# GitHub Copilot Agent Skills

A growing collection of GitHub Copilot agents and reusable skills designed to extend GitHub Copilot's capabilities across engineering and architecture workflows. 

Skills are focused instruction bundles that GitHub Copilot loads when a task
matches their description. Agents are selectable GitHub Copilot Chat modes with
a defined role, workflow, and tool access.

## Choose an Installation

| Goal | Recommended approach |
|---|---|
| Install the curated architecture, Terraform, and diagramming bundles | [Install the curated collection with APM](#install-the-curated-collection) |
| Install one focused bundle | [Install an individual bundle with APM](#install-an-individual-bundle) |
| Explore every skill, including work in progress | [Clone the repository](#clone-the-repository) |

The root APM package installs the curated bundles listed below. It does not
install every skill in the repository. Only directories with a committed
`apm.yml` manifest are presented as installable packages. Clone the repository
to explore unbundled utilities and work-in-progress skills.

## Curated Bundles

| Bundle | Included content | Requirements |
|---|---|---|
| `packages/architect` | `azure-architect` agent; `architecture-design`, `waf-assessment`, and `azure-pricing` skills | Azure MCP |
| `packages/terraform` | `terraform-provider-upgrade` and `gh-aw-builder` agents; `terraform-module-creator` and `terraform-provider-upgrade` skills | Docker for Terraform MCP; Azure MCP for module creation |
| `packages/diagramming` | `drawio-mcp-diagramming`, `azure-drawio-mcp-diagramming`, and `excalidraw-mcp-diagramming` skills | Draw.io and Excalidraw MCP servers configured by APM |
| `packages/drawio-mcp-diagramming` | Standalone `drawio-mcp-diagramming` skill | Draw.io MCP server configured by APM |

The standalone Draw.io package is useful when you only want Draw.io support.
It is already covered by `packages/diagramming`.

## Skills

Skills with no included bundle are currently available by cloning the
repository.

| Skill | What it does | Included bundle |
|---|---|---|
| `architecture-design` | Designs Azure solutions from requirements, including service selection, WAF alignment, cost estimates, and HLD output. | `packages/architect` |
| `waf-assessment` | Assesses an architecture against the five Azure Well-Architected Framework pillars and provides scored recommendations. | `packages/architect` |
| `azure-pricing` | Looks up live Azure retail pricing, estimates template costs, and compares regions and pricing types. | `packages/architect` |
| `terraform-module-creator` | Designs maintainable Terraform modules from infrastructure requirements, with Azure-focused patterns and validation guidance. | `packages/terraform` |
| `terraform-provider-upgrade` | Guides safe Terraform provider upgrades, breaking-change analysis, resource migration with `moved` blocks, and validation. | `packages/terraform` |
| `drawio-mcp-diagramming` | Creates and edits Draw.io diagrams with Azure2 and AWS4 icon guidance. | `packages/diagramming`, `packages/drawio-mcp-diagramming` |
| `azure-drawio-mcp-diagramming` | Creates and edits Azure-focused Draw.io diagrams with Azure icon rendering guidance. | `packages/diagramming` |
| `excalidraw-mcp-diagramming` | Creates and edits live Excalidraw canvases and exports diagrams to PNG, SVG, `.excalidraw`, or a shareable URL. | `packages/diagramming` |
| `skill-creator` | Creates, updates, reviews, and validates GitHub Copilot `SKILL.md` files. | - |
| `apm-package-author` | Creates and troubleshoots APM manifests for distributing skills, agents, and MCP server configuration. | - |
| `gh-aw-operations` | Creates, compiles, debugs, and manages GitHub Agentic Workflows (`gh-aw`). | - |

## Work in Progress

These skills are under active development and may change as their coverage
improves. They are available by cloning the repository.

| Skill | What it does |
|---|---|
| `cost-optimization` | Identifies Azure cost reduction opportunities and estimates savings and ROI. |
| `azure-apim-architecture` | Analyzes Azure API Management topology, networking, environment strategy, and cost trade-offs. |
| `apim-policy-authoring` | Generates APIM policy XML for authentication, rate limiting, CORS, error handling, and transformations. |
| `api-security-review` | Reviews APIM configurations against OWASP API Security Top 10 and Azure security guidance. |
| `apiops-deployment` | Guides APIM deployments with Bicep or Terraform and CI/CD promotion workflows. |

## Agents

Select an agent from the GitHub Copilot Chat agent picker when you want a
guided, role-specific workflow.

| Agent file | Agent | What it does | Availability |
|---|---|---|---|
| `azure-architect.agent.md` | Azure Architect Agent | Designs Azure architectures and produces HLD documents aligned to WAF and CAF. | `packages/architect` |
| `terraform-provider-upgrade.agent.md` | Terraform Provider Upgrade | Performs structured Terraform provider upgrades and compatibility validation. | `packages/terraform` |
| `gh-aw-builder.agent.md` | GitHub Agentic Workflow Builder | Creates markdown-based GitHub Agentic Workflows with frontmatter, MCP wiring, and safe outputs. | `packages/terraform` |
| `apim-policy-author.agent.md` | APIM Policy Author | Generates Azure API Management policy XML for authentication, rate limiting, CORS, error handling, and transformations. | Repository only |

## Prerequisites

### Always Required

- VS Code or VS Code Insiders
- [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)
  with GitHub Copilot Chat enabled

### MCP Servers

Some skills call MCP servers for live data or diagram editing. APM configures
the MCP servers bundled in package manifests. The repository also includes
[`.vscode/mcp.json`](.vscode/mcp.json) for direct clones.

| MCP server | Used by | Setup |
|---|---|---|
| Azure MCP | `architecture-design`, `waf-assessment`, `azure-pricing`, `cost-optimization`, `terraform-module-creator` | Install the [Azure Tools](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azure-github-copilot) VS Code extension. The server registers automatically. |
| Draw.io MCP | `drawio-mcp-diagramming`, `azure-drawio-mcp-diagramming` | Configured automatically by the relevant APM bundles or the included `.vscode/mcp.json`. |
| Excalidraw MCP | `excalidraw-mcp-diagramming` | Configured automatically by `packages/diagramming` or the included `.vscode/mcp.json`. |
| Terraform MCP | `terraform-provider-upgrade`, `terraform-module-creator` | Configured automatically by `packages/terraform` or the included `.vscode/mcp.json`. Requires Docker. HCP Terraform or Terraform Enterprise credentials are optional for public registry use. |

## Getting Started

### Install APM

Install [APM (Agent Package Manager)](https://github.com/microsoft/apm):

```bash
# macOS / Linux
curl -sSL https://aka.ms/apm-unix | sh

# Windows PowerShell
irm https://aka.ms/apm-windows | iex
```

### Install the Curated Collection

```bash
apm install thomast1906/github-copilot-agent-skills --target copilot
```

### Install an Individual Bundle

```bash
apm install thomast1906/github-copilot-agent-skills/packages/architect --target copilot
apm install thomast1906/github-copilot-agent-skills/packages/terraform --target copilot
apm install thomast1906/github-copilot-agent-skills/packages/diagramming --target copilot
apm install thomast1906/github-copilot-agent-skills/packages/drawio-mcp-diagramming --target copilot
```

APM deploys agents and MCP configuration to the selected target. Current APM
versions deploy skills to `.agents/skills/` by default; use
`--legacy-skill-paths` if you need per-client skill directories such as
`.github/skills/`.

### Clone the Repository

1. Clone or fork this repository.
2. Open the repository folder in VS Code with GitHub Copilot Chat enabled.
3. Start the MCP servers needed for the skills you plan to use.
4. Select an agent from the GitHub Copilot Chat agent picker, or ask GitHub
   Copilot to use a skill explicitly, such as:
   `Use the waf-assessment skill to review this architecture.`

## Repository Layout

```text
.github/
├── agents/               # Selectable GitHub Copilot Chat agents
├── skills/               # Stable and work-in-progress skill directories
├── scripts/              # Repository validation scripts
└── workflows/            # CI validation
packages/
├── architect/            # Azure architecture APM bundle
├── terraform/            # Terraform APM bundle
├── diagramming/          # Complete diagramming APM bundle
└── drawio-mcp-diagramming/ # Standalone Draw.io APM bundle
apm.yml                   # Root curated APM package
```

## Contributing

Each skill lives under `.github/skills/<skill-name>/` with a `SKILL.md` file
containing its purpose, trigger description, workflow, and tool guidance.
Supporting material belongs in `references/`, and reusable helpers belong in
`scripts/`.

Before opening a pull request, run:

```bash
./.github/scripts/validate-agent-skills.sh
```
