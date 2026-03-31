# GitHub Copilot Agent Skills

A growing collection of GitHub Copilot agents and reusable skills designed to extend Copilot's capabilities across engineering and architecture workflows. Skills are domain-specific bundles of knowledge, prompting logic, and MCP tool usage that Copilot loads automatically when relevant.

## Structure

```
.github/
├── agents/
└── skills/
```

## Prerequisites

### Always Required

- VS Code (or VS Code Insiders)
- **[GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)** extension with Copilot Chat enabled

### MCP Servers

Some skills require MCP servers to be active. This repository includes a pre-configured `.vscode/mcp.json` for the servers below. VS Code will prompt you to start them when first used.

| MCP Server | Skills that use it | Setup |
|---|---|---|
| **Azure MCP** (via VS Code extension) | `azure-pricing`, `cost-optimization`, `waf-assessment`, `architecture-design` | Install the **[Azure Tools](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azure-github-copilot)** VS Code extension — the Azure MCP Server registers automatically, no `mcp.json` entry needed |
| **Draw.io MCP** (`https://mcp.draw.io/mcp`) | `azure-drawio-mcp-diagramming`, `drawio-mcp-diagramming` | Included in `.vscode/mcp.json` — no additional install required |
| **Excalidraw MCP** (`https://mcp.excalidraw.com`) | `excalidraw-mcp-diagramming` | Included in `.vscode/mcp.json` — no additional install required |
| **Terraform MCP** (Docker image `hashicorp/terraform-mcp-server`) | `terraform-provider-upgrade` | Included in `.vscode/mcp.json` — requires **Docker** to be running; optionally provide a HCP Terraform/TFE token when prompted |

## Agents

Agents are pre-configured Copilot modes with domain-specific instructions and tool access. Invoke them from the Copilot Chat agent picker.

| Agent file | Name | What it does |
|---|---|---|
| `apim-policy-author.agent.md` | APIM Policy Author | Generates production-ready Azure API Management policy XML for authentication (OAuth 2.0, JWT, subscription keys), rate limiting, CORS, error handling, and request/response transformations |
| `azure-architect.agent.md` | Azure Architect | Designs production-ready Azure architectures aligned to the Well-Architected Framework and Cloud Adoption Framework; produces HLD documents with service selection, cost estimates, and IaC |
| `gh-aw-builder.agent.md` | GitHub Agentic Workflow Builder | Creates and configures markdown-based GitHub Agentic Workflows (gh-aw) with correct frontmatter, MCP server wiring, safe-outputs, and best practices |
| `terraform-provider-upgrade.agent.md` | Terraform Provider Upgrade | Safely upgrades Terraform providers, detects breaking changes, migrates removed resources using `moved` blocks, and validates compatibility |

## Skills

Skills are invoked automatically by Copilot based on relevance, or explicitly by name in chat.

> 🚧 **WIP** — Skills marked with 🚧 WIP are under active development. They are functional but may have incomplete coverage, rough edges, or breaking changes as they evolve.

### Azure Architecture & Design

| Skill | Description |
|---|---|
| `architecture-design` | Designs Azure solutions from requirements — service selection, WAF alignment, cost estimates, and HLD output. Uses **Azure MCP** for live pricing. |
| `waf-assessment` | Assesses an architecture against all five WAF pillars (Reliability, Security, Cost, Operational Excellence, Performance) and provides scored recommendations. Uses **Azure MCP**. |
| `cost-optimization` 🚧 WIP | Identifies cost reduction opportunities across Azure workloads, quantifies savings, and calculates ROI. Uses **Azure MCP**. |
| `azure-pricing` | Looks up real-time Azure retail pricing for any service, SKU, or region; estimates costs from Bicep/ARM/Terraform templates; compares Consumption vs Reservation pricing. Defaults to GBP. Uses **Azure MCP**. |

### Azure API Management (APIM)

| Skill | Description |
|---|---|
| `azure-apim-architecture` 🚧 WIP | Analyses APIM architecture decisions — VNet Internal vs External, Front Door vs App Gateway, workspaces vs instances, multi-environment strategies, and cost trade-offs |
| `apim-policy-authoring` 🚧 WIP | Generates production-ready APIM policy XML for OAuth 2.0, JWT validation, subscription keys, rate limiting, CORS, error handling, and transformations |
| `api-security-review` 🚧 WIP | Reviews APIM configurations against OWASP API Security Top 10, VNet Internal mode, Private Link, and Azure Security Benchmark |
| `apiops-deployment` 🚧 WIP | Guides APIM deployments using Bicep/Terraform and CI/CD pipelines (GitHub Actions / Azure DevOps); covers dev→test→prod promotion |

### Infrastructure as Code

| Skill | Description |
|---|---|
| `terraform-provider-upgrade` | Safe Terraform provider upgrades with breaking change detection, automatic resource migration using `moved` blocks, and state management. Uses **Terraform MCP**. |

### Diagramming

| Skill | Description |
|---|---|
| `azure-drawio-mcp-diagramming` | Creates and edits Azure architecture diagrams via the Draw.io MCP; Azure-only icon library with icon catalog and rendering troubleshooting. Uses **Draw.io MCP**. |
| `drawio-mcp-diagramming` | Creates and edits architecture diagrams via the Draw.io MCP; supports both Azure2 and AWS4 icon libraries. Uses **Draw.io MCP**. |
| `excalidraw-mcp-diagramming` | Creates and edits diagrams on a live Excalidraw canvas — architectures, flowcharts, sequence diagrams, mind maps; exports to PNG, SVG, `.excalidraw`, or shareable URL. Uses **Excalidraw MCP**. |

### GitHub Workflows

| Skill | Description |
|---|---|
| `gh-aw-operations` | Comprehensive knowledge for creating, debugging, and managing GitHub Agentic Workflows (gh-aw) — frontmatter spec, MCP wiring, safe-outputs, and common patterns |

## Getting Started

### Option A — APM (if using GitHub Copilot & vscode)

Install individual bundles or all agents and skills at once using [APM (Agent Package Manager)](https://github.com/microsoft/apm).

**Install APM:**
```bash
curl -sSL https://aka.ms/apm-unix | sh   # macOS / Linux
irm https://aka.ms/apm-windows | iex     # Windows
```
# All agents and skills
apm install thomast1906/github-copilot-agent-skills --runtime vscode

# Or pick a bundle
apm install thomast1906/github-copilot-agent-skills/packages/architect --runtime vscode
apm install thomast1906/github-copilot-agent-skills/packages/terraform --runtime vscode
apm install thomast1906/github-copilot-agent-skills/packages/diagramming --runtime vscode
```

| Bundle | What's included |
|---|---|
| `packages/architect` | Design and review Azure architectures — service selection, WAF pillar assessments, and live pricing lookups. Includes the `azure-architect` agent and `architecture-design`, `waf-assessment`, `azure-pricing` skills. |
| `packages/terraform` | Safely upgrade Terraform providers and build GitHub Agentic Workflows. Includes `terraform-provider-upgrade` and `gh-aw-builder` agents, matching skills, and the Terraform MCP (requires Docker). |
| `packages/diagramming` | Create and edit architecture diagrams via Draw.io and Excalidraw MCP. Includes `drawio-mcp-diagramming`, `azure-drawio-mcp-diagramming`, and `excalidraw-mcp-diagramming` skills. |

APM installs skills to `.github/skills/`, agents to `.github/agents/`, and configures MCP servers in `.vscode/mcp.json` automatically.

> **Note:** The Azure MCP (used by `azure-pricing`, `waf-assessment`, `cost-optimization`, `architecture-design`) is provided by the **[Azure Tools](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azure-github-copilot)** VS Code extension — install that separately.

---

### Option B — Clone directly

1. Clone or fork this repository.
2. Open the folder in VS Code with GitHub Copilot Chat enabled.
3. Skills and agents are registered via `.github/copilot-instructions.md` and load automatically.
4. To invoke an agent, open Copilot Chat and select it from the agent picker (e.g. **Azure Architect**).
5. To invoke a skill explicitly, ask Copilot by name — e.g. _"use the waf-assessment skill to review this architecture"_.
6. For MCP-backed skills, ensure the relevant MCP server is running (see [Prerequisites → MCP Servers](#mcp-servers) above).

## Contributing

Each skill lives in its own directory under `.github/skills/` and follows a consistent structure: a `SKILL.md` defining purpose, inputs, output format, and tool usage, plus an optional `references/` folder for supporting data. New agents are added as `.agent.md` files under `.github/agents/`.
