# MCP Tool Reference — Terraform Module Creator

This document describes the MCP tools available to the `terraform-module-creator` skill, when to use each one, and example call patterns.

## Available MCP Servers

| MCP Server | Purpose |
|-----------|---------|
| **HashiCorp Terraform Registry MCP** | Provider docs, resource schemas, module registry, policy sets |
| **Azure MCP Server** | Azure Terraform best practices, Bicep schemas, pricing |

---

## HashiCorp Terraform Registry MCP Tools

### `mcp_terraform_get_latest_provider_version`

Get the current latest version of a Terraform provider.

**When to use:** Before generating `versions.tf` — always pin to the latest stable version.

```bash
mcp_terraform_get_latest_provider_version(
  namespace="hashicorp",
  name="azurerm"
)
# → Returns: { version: "4.x.x" }
```

Common providers for Azure modules:
- `hashicorp/azurerm` — primary Azure provider
- `hashicorp/azuread` — Azure Active Directory resources
- `hashicorp/random` — random name/suffix generation
- `hashicorp/time` — time-based resources

---

### `mcp_terraform_get_provider_capabilities`

Discover what resource types, data sources, and functions a provider exposes.

**When to use:** When you need to understand what resources exist for a service area before designing the module (e.g., "what azurerm resources exist for Storage?").

```bash
mcp_terraform_get_provider_capabilities(
  namespace="hashicorp",
  name="azurerm",
  version="latest"
)
# → Returns summary of resources, data-sources, functions, guides
```

---

### `mcp_terraform_search_providers`

Find provider documentation for a specific resource or data source by slug.

**When to use:** Before designing variables and outputs — get the full resource argument list so you know what is available to expose.

```bash
# Find resource docs for a Storage Account
mcp_terraform_search_providers(
  provider_namespace="hashicorp",
  provider_name="azurerm",
  service_slug="storage_account",
  provider_document_type="resources",
  provider_version="latest"
)

# Find data source docs
mcp_terraform_search_providers(
  provider_namespace="hashicorp",
  provider_name="azurerm",
  service_slug="storage_account",
  provider_document_type="data-sources",
  provider_version="latest"
)

# Find upgrade guide
mcp_terraform_search_providers(
  provider_namespace="hashicorp",
  provider_name="azurerm",
  service_slug="4.0-upgrade-guide",
  provider_document_type="guides",
  provider_version="latest"
)
```

Common `service_slug` examples:
- `storage_account` → `azurerm_storage_account`
- `key_vault` → `azurerm_key_vault`
- `app_service_plan` → `azurerm_service_plan`
- `linux_web_app` → `azurerm_linux_web_app`
- `kubernetes_cluster` → `azurerm_kubernetes_cluster`
- `container_app` → `azurerm_container_app`
- `mssql_server` → `azurerm_mssql_server`
- `cosmosdb_account` → `azurerm_cosmosdb_account`
- `private_endpoint` → `azurerm_private_endpoint`
- `monitor_diagnostic_setting` → `azurerm_monitor_diagnostic_setting`
- `role_assignment` → `azurerm_role_assignment`
- `user_assigned_identity` → `azurerm_user_assigned_identity`

---

### `mcp_terraform_get_provider_details`

Fetch the full documentation content for a specific provider resource or guide using the `provider_doc_id` returned by `mcp_terraform_search_providers`.

**When to use:** After `search_providers` — get full argument reference, attribute reference, and examples. This is the primary tool for understanding what a resource accepts and what it outputs.

```bash
mcp_terraform_get_provider_details(
  provider_doc_id="<id-from-search_providers>"
)
# → Returns: full argument reference, attribute reference, import docs, example usage
```

**Important:** Always call `search_providers` first to get the `provider_doc_id`. Do not guess IDs.

---

### `mcp_terraform_search_modules`

Search the Terraform public registry for existing modules.

**When to use:** Before designing a module — use as a **reference point**, not a replacement. AVM and most registry modules are heavily abstracted and do not align with the KISS principle this skill applies. Review them to understand what arguments matter in practice and what complexity to avoid, then design a simpler custom module.

```bash
mcp_terraform_search_modules(module_query="azure storage account")
mcp_terraform_search_modules(module_query="azure key vault")
mcp_terraform_search_modules(module_query="azure kubernetes service AKS")
```

**What to take from the results:** Look at input variable counts (a signal of over-abstraction), common required inputs, and output patterns. Then design a leaner interface.

---

### `mcp_terraform_get_module_details`

Get full documentation for a specific registry module using a `module_id` from `search_modules`.

**When to use:** After finding a candidate module in `search_modules` — review its inputs, outputs, and scope to assess whether it meets the requirement or whether a custom module is still justified.

```bash
mcp_terraform_get_module_details(
  module_id="<module_id-from-search_modules>"
)
# → Returns: README, inputs, outputs, submodules, examples
```

---

### `mcp_terraform_search_policies`

Search for Sentinel/OPA policy sets in the Terraform registry.

**When to use:** When a module needs to align with compliance requirements (CIS, NIST, PCI-DSS) — check what policies apply to the resources being wrapped. This informs default values and guardrails.

```bash
# Find CIS policies for Azure
mcp_terraform_search_policies(
  policy_query="CIS Azure"
)

# Find NIST policies
mcp_terraform_search_policies(
  policy_query="NIST Azure Terraform"
)
```

---

### `mcp_terraform_get_policy_details`

Get the full content of a specific policy set using a `terraform_policy_id` from `search_policies`.

```bash
mcp_terraform_get_policy_details(
  terraform_policy_id="<id-from-search_policies>"
)
```

---

## Azure MCP Server Tools

### `azure-azureterraformbestpractices`

Get Azure Terraform best practices from the Azure MCP server. This returns official Microsoft guidance on writing Terraform for Azure — naming, tagging, identity, networking, security.

**When to use:** At the start of module design to ground decisions in Azure platform standards. Also use when reviewing an existing module.

```bash
azure-azureterraformbestpractices(
  intent="Azure Terraform best practices for storage account module"
)
```

---

### `azure-get_azure_bestpractices`

Get general Azure best practices for a specific service or pattern.

**When to use:** When designing the module boundary and defaults — understand what Azure recommends for the service being wrapped (e.g., identity configuration, diagnostic settings, private endpoints).

```bash
azure-get_azure_bestpractices(
  intent="Azure best practices for Key Vault"
)

azure-get_azure_bestpractices(
  intent="Azure best practices for storage account security and networking"
)
```

---

### `azure-bicepschema`

Look up Azure resource schemas and valid property values from the Bicep schema registry.

**When to use:** When you need to understand the valid values for a resource property that isn't clearly documented in the Terraform provider docs (e.g., SKU names, tier values, kind values). The Bicep schema reflects the ARM API directly.

```bash
# Learn about the schema
azure-bicepschema(
  intent="get schema",
  learn=true
)

# Get schema for a specific resource type
azure-bicepschema(
  command="get_schema",
  intent="storage account schema azurerm",
  parameters={ "resourceType": "Microsoft.Storage/storageAccounts" }
)
```

---

### `azure-pricing` (via azure-pricing skill)

Look up real-time Azure retail pricing for the resources the module will create.

**When to use:** When generating the module README — include a cost estimate section so consumers know what the module will cost at a typical scale. Also use when comparing SKU options.

**Always use GBP as the default currency.**

Example workflow — pricing a storage account module:
```
1. Call azure-pricing tool with service="Storage", region="uksouth", currency="GBP"
2. Filter for Standard_LRS, Standard_GRS, Standard_ZRS
3. Include in README as a "Typical Cost" table
```

See the [azure-pricing skill](../../azure-pricing/SKILL.md) for full tool parameter reference.

---

## Decision: When to Call Which Tool

| Task | Tool(s) to call |
|------|----------------|
| Check if a module already exists | `mcp_terraform_search_modules` → `mcp_terraform_get_module_details` |
| Get the full argument list for a resource | `mcp_terraform_search_providers` → `mcp_terraform_get_provider_details` |
| Find what resources exist for a service area | `mcp_terraform_get_provider_capabilities` |
| Pin provider version in versions.tf | `mcp_terraform_get_latest_provider_version` |
| Apply compliance-aware defaults | `mcp_terraform_search_policies` → `mcp_terraform_get_policy_details` |
| Ground module design in Azure standards | `azure-azureterraformbestpractices` |
| Understand platform-level best practices | `azure-get_azure_bestpractices` |
| Validate SKU/kind/tier values | `azure-bicepschema` |
| Add cost estimate to README | `azure-pricing` skill |

---

## Example: Full MCP Workflow for a New Module

This example shows the MCP tool sequence for creating an Azure Storage Account module.

```bash
# 1. Get Azure Terraform best practices first
azure-azureterraformbestpractices(intent="storage account Terraform module Azure")

# 2. Check if an Azure Verified Module already exists
mcp_terraform_search_modules(module_query="azure storage account verified")
# → If a good match exists, recommend it. If not, continue.

# 3. Get the latest azurerm version for versions.tf
mcp_terraform_get_latest_provider_version(namespace="hashicorp", name="azurerm")

# 4. Find the storage account resource documentation
mcp_terraform_search_providers(
  provider_namespace="hashicorp",
  provider_name="azurerm",
  service_slug="storage_account",
  provider_document_type="resources",
  provider_version="latest"
)
# → Capture provider_doc_id from result

# 5. Get full argument reference
mcp_terraform_get_provider_details(provider_doc_id="<id>")
# → Review required and optional arguments, attribute reference

# 6. Also get diagnostic settings resource schema
mcp_terraform_search_providers(
  provider_namespace="hashicorp",
  provider_name="azurerm",
  service_slug="monitor_diagnostic_setting",
  provider_document_type="resources",
  provider_version="latest"
)

# 7. Check compliance policies that apply
mcp_terraform_search_policies(policy_query="CIS Azure storage")

# 8. Get cost data for README
# → Call azure-pricing skill for Standard_LRS, Standard_GRS in uksouth
```
