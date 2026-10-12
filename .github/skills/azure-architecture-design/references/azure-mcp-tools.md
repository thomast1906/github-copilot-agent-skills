# Azure MCP Tool Routing

The core design evidence sequence is `get_azure_bestpractices`, `documentation`, `wellarchitectedframework`, then live pricing. Discover the registered tool names and parameter schemas at runtime; Azure MCP capabilities evolve and hosts can expose them differently.

`get_azure_bestpractices` supplies platform guidance for its supported resource types. It does not replace service-specific Microsoft Learn research or Well-Architected service guidance. Use `documentation` to validate the service decision, then `wellarchitectedframework` to assess the selected service across the five pillars.

| Tool | When to use | Expected result |
|---|---|---|
| `azure-mcp/cloudarchitect` | Requirements are incomplete or two broad architecture patterns need structured comparison. | A guided requirements pass and candidate topology; validate its recommendations with documentation and WAF guidance. |
| `azure-mcp/bicepschema` | An ARM resource property, valid value, API version, or SKU affects an IaC-oriented design choice. | Verified resource-schema constraints. |
| Bicep MCP Server / Azure Verified Modules | Bicep is the delivery path and an AVM module may cover a selected resource. | A supported implementation starting point. |
| `azure-mcp/azureterraformbestpractices` | Terraform is selected or mandated. | Azure-specific Terraform design and implementation guidance. |
| Azure Resource Graph query | The user authorises inspection of an existing Azure estate for migration, rationalisation, or extension. | Actual deployed-resource evidence; never assume it is complete configuration evidence. |
| `azure-mcp/policy` | Existing policy assignments or organisation guardrails can constrain service, region, SKU, or network choices. | Policy evidence and compliance constraints to include in the decision log. |
| `azure-mcp/quota` | Expected scale, SKU capacity, or a new-region rollout might be quota-constrained. | A feasibility check and any required quota increase. |
| `azure-mcp/search` | An Azure sample, pattern, or artefact would help after official documentation establishes the decision. | Supplemental implementation examples, not a replacement for Learn guidance. |

Use `azure-mcp/documentation` for decision-critical service limits, feature support, private DNS, CAF conventions, and current product behaviour. Record the resulting Microsoft Learn URLs in the HLD's References section.
