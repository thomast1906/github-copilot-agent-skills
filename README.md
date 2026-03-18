# GitHub Copilot Agent Skills

A growing collection of GitHub Copilot agents and reusable skills. This repository is continuously updated with new agents and domain-specific skills designed to extend Copilot's capabilities across a range of engineering and architecture workflows.

Several skills integrate with the **[Azure MCP Server](https://learn.microsoft.com/en-us/azure/developer/azure-mcp-server/overview)** (`ms-azuretools.vscode-azure-github-copilot` VS Code extension) to query live Azure data — including real-time retail pricing, resource graph, and service configuration — without requiring any additional `mcp.json` configuration. Skills that use Azure MCP are noted in the table below.

## Structure

```
.github/
├── agents/
└── skills/
```

## Agents

| Agent | Description |
|-------|-------------|
| `apim-policy-author` | APIM Policy Author — generates production-ready Azure API Management policy XML for authentication, rate limiting, CORS, error handling, and transformations with hybrid auth best practices |
| `azure-architect` | Azure Solutions Architect — designs production-ready architectures aligned to WAF and CAF |
| `gh-aw-builder` | GitHub Agentic Workflow Builder — creates and configures markdown-based AI-powered GitHub Agentic Workflows (gh-aw) with proper frontmatter, MCP servers, safe-outputs, and best practices |
| `terraform-provider-upgrade` | Terraform Provider Upgrade — safely upgrades Terraform providers, detects breaking changes, migrates removed resources with moved blocks, and ensures compatibility through comprehensive upgrade workflows |

## Skills

| Skill | Description |
|-------|-------------|
| `api-security-review` | Reviews API Management configurations against OWASP API Security Top 10 and Azure Security Benchmark |
| `apim-policy-authoring` | Generates production-ready APIM policy XML for auth, rate limiting, CORS, and transformations |
| `apiops-deployment` | Guides APIM deployments using Bicep/Terraform and CI/CD pipelines |
| `architecture-design` | Designs Azure architectures from requirements with service selection, cost estimates, and WAF alignment |
| `azure-apim-architecture` | Analyses APIM architecture decisions including VNet topology, multi-environment strategies, and component trade-offs |
| `azure-drawio-mcp-diagramming` | Creates and edits Azure architecture diagrams using the Draw.io MCP integration with reliable Azure icon rendering and troubleshooting |
| `azure-pricing` | Uses the Azure MCP Server pricing tool to look up real-time Azure retail pricing for any service, SKU, or region; estimates deployment costs from Bicep/ARM/Terraform templates; compares Consumption vs Reservation pricing. Defaults to GBP. Includes reference files for cost formulas and SKU name quirks. [Requires Azure MCP.](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azure-mcp-server) |
| `cost-optimization` | Identifies cost reduction opportunities and quantifies savings across Azure workloads |
| `drawio-mcp-diagramming` | Creates and edits architecture diagrams using the Draw.io MCP integration with support for both Azure and AWS icon libraries |
| `excalidraw-mcp-diagramming` | Creates and edits diagrams on a live Excalidraw canvas using the Excalidraw MCP server; supports architectures, workflows, flowcharts, mind maps, and sequence diagrams with PNG/SVG/URL export |
| `gh-aw-operations` | Comprehensive skills for creating, compiling, debugging, and managing GitHub Agentic Workflows (gh-aw) |
| `terraform-provider-upgrade` | Safe Terraform provider upgrades with automatic resource migration, breaking change detection, and state management using moved blocks |
| `waf-assessment` | Assesses architectures across all five WAF pillars and provides scored recommendations |

## Usage

### Prerequisites

- VS Code with the **GitHub Copilot** extension
- For skills marked **Requires Azure MCP**: install the **[Azure VS Code extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azure-github-copilot)** (`ms-azuretools.vscode-azure-github-copilot`) — the Azure MCP Server is registered automatically, no `mcp.json` configuration needed

### Getting Started

1. Clone or fork this repository.
2. Open in VS Code with GitHub Copilot Chat enabled.
3. Reference an agent via `@azure-architect` or invoke a skill by asking Copilot to use it by name.
4. Skills are loaded automatically when referenced in `copilot-instructions.md` or triggered by relevant queries.

## Contributing

New agents and skills are added on an ongoing basis. Each skill lives in its own directory under `.github/skills/` and follows a consistent `SKILL.md` structure defining its purpose, inputs, and output format.
