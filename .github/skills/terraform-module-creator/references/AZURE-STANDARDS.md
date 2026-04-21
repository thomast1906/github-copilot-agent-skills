# Azure Standards Reference — Terraform Module Creator

Platform standards that Azure Terraform modules should align with. Use `azure-azureterraformbestpractices` and `azure-get_azure_bestpractices` MCP tools to get the latest official guidance before finalising module design.

---

## Naming Conventions

Follow the [CAF naming standard](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/resource-naming).

**Pattern:** `{resource-type-abbreviation}-{workload}-{environment}-{region}-{instance}`

| Resource Type | Abbreviation | Example |
|---|---|---|
| Resource Group | `rg` | `rg-myapp-prod-uksouth-001` |
| Storage Account | `st` | `stmyappproduksouth001` (no hyphens, max 24 chars, lowercase) |
| Key Vault | `kv` | `kv-myapp-prod-uksouth-001` |
| App Service Plan | `asp` | `asp-myapp-prod-uksouth-001` |
| App Service (Web App) | `app` | `app-myapp-prod-uksouth-001` |
| Azure SQL Server | `sql` | `sql-myapp-prod-uksouth-001` |
| Azure SQL Database | `sqldb` | `sqldb-myapp-prod-uksouth-001` |
| Cosmos DB Account | `cosmos` | `cosmos-myapp-prod-uksouth-001` |
| Azure Kubernetes Service | `aks` | `aks-myapp-prod-uksouth-001` |
| Container App Environment | `cae` | `cae-myapp-prod-uksouth-001` |
| Container App | `ca` | `ca-myapp-prod-uksouth-001` |
| Log Analytics Workspace | `law` | `law-myapp-prod-uksouth-001` |
| Application Insights | `appi` | `appi-myapp-prod-uksouth-001` |
| Virtual Network | `vnet` | `vnet-myapp-prod-uksouth-001` |
| Subnet | `snet` | `snet-myapp-prod-uksouth-001` |
| Network Security Group | `nsg` | `nsg-myapp-prod-uksouth-001` |
| Private Endpoint | `pe` | `pe-myapp-storage-uksouth-001` |
| User Assigned Identity | `id` | `id-myapp-prod-uksouth-001` |
| API Management | `apim` | `apim-myapp-prod-uksouth-001` |
| Service Bus Namespace | `sb` | `sb-myapp-prod-uksouth-001` |
| Event Hub Namespace | `evhns` | `evhns-myapp-prod-uksouth-001` |

**Module variable pattern:**
- Accept `name` as a variable when the caller controls the name
- Or accept components (`prefix`, `workload`, `environment`, `location`, `instance`) and construct the name with a local

**Storage Account special case:** No hyphens, lowercase only, max 24 chars. Construct with `replace(lower(...), "-", "")`.

---

## Required Tags

Apply these tags to every resource in a module. Accept them via a `tags` variable and merge with module-level defaults.

```hcl
tags = {
  environment = "dev|staging|prod"    # required
  project     = "project-name"         # required
  owner       = "team-name"            # required
  cost-center = "CC-XXXXX"             # required
  managed-by  = "terraform"            # set by module as a default
}
```

---

## Security Defaults

Modules should be opinionated on security where it reduces inconsistency.

### Managed Identity

**Always prefer system-assigned or user-assigned managed identity over keys or connection strings.**

```hcl
identity {
  type = "SystemAssigned"  # default for most resources
}
```

Modules that interact with other Azure services (e.g., a web app reading from Key Vault) should accept a `user_assigned_identity_id` variable rather than managing the identity inside the module.

### HTTPS / TLS

Where applicable, set secure transport as the default:

```hcl
# App Service
https_only = true

# Storage Account
enable_https_traffic_only = true
min_tls_version           = "TLS1_2"

# SQL
minimum_tls_version = "1.2"
```

### Public Network Access

Where applicable, default to disabled or restricted:

```hcl
# Storage Account
public_network_access_enabled = false

# Key Vault
public_network_access_enabled = false

# SQL Server
public_network_access_enabled = false
```

Expose as a variable when consumers may legitimately need public access in dev environments.

### Soft Delete / Purge Protection

For data stores that support it:

```hcl
# Key Vault
soft_delete_retention_days  = 7
purge_protection_enabled    = true

# Storage Account (blob soft delete)
blob_properties {
  delete_retention_policy {
    days = 7
  }
}
```

---

## Observability Defaults

Include diagnostic settings as an optional feature in every module that creates a significant resource.

- Accept `log_analytics_workspace_id` as a variable — do not create a workspace
- Default diagnostic settings to `enabled = false`
- When enabled, use `category_group = "allLogs"` and `AllMetrics`

---

## Networking Assumptions

Modules should not create VNets, subnets, or DNS zones. Accept these as IDs.

**Standard pattern:**
```hcl
variable "subnet_id" {
  description = "Resource ID of the subnet to attach to. Required when private_endpoint.enabled is true."
  type        = string
  default     = null
}

variable "private_dns_zone_ids" {
  description = "List of private DNS zone resource IDs for private endpoint registration."
  type        = list(string)
  default     = []
}
```

---

## Azure Regions

Use ARM region names (lowercase, no spaces) in variables. Common values:

| Region | ARM name |
|--------|---------|
| UK South | `uksouth` |
| UK West | `ukwest` |
| West Europe | `westeurope` |
| North Europe | `northeurope` |
| East US | `eastus` |
| East US 2 | `eastus2` |
| West US 2 | `westus2` |
| Australia East | `australiaeast` |

---

## Azure Verified Modules

Check [Azure Verified Modules](https://azure.github.io/Azure-Verified-Modules/) (AVM) and the [Terraform Registry](https://registry.terraform.io/) for reference when designing a module. Use `mcp_terraform_search_modules` to find them.

**Do not recommend AVM modules over custom modules.** AVM modules are highly abstracted, expose a large number of variables, and often violate the KISS principle this skill is built around. They are useful as a reference to understand what arguments the resource exposes in practice and what outputs consumers typically need — but they are not the target output of this skill.

Use registry modules to inform interface design, then build a leaner, simpler custom module that solves the actual requirement without unnecessary optionality.

---

## Environment Separation

Modules should support environment differences through variables, not through conditional logic inside the module.

**Good:**
```hcl
variable "sku" {
  description = "SKU tier. Use 'Basic' for dev, 'Standard' for production."
  type        = string
  default     = "Standard"
}
```

**Avoid:**
```hcl
variable "environment" {
  type = string
}

locals {
  # Avoid: business logic about environments inside the module
  sku = var.environment == "prod" ? "Standard" : "Basic"
}
```

Callers should decide what SKU is appropriate for their environment. The module should not bake in environment assumptions.

---

## Reference Documentation

- [CAF Naming Conventions](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/resource-naming)
- [CAF Tagging Strategy](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/resource-tagging)
- [Azure Verified Modules](https://azure.github.io/Azure-Verified-Modules/)
- [Terraform AzureRM Provider Docs](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure Well-Architected Framework](https://learn.microsoft.com/en-us/azure/well-architected/)
- [Azure Private Endpoint DNS](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-dns)
