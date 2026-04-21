# Module Patterns Reference — Terraform Module Creator

Common patterns for Azure Terraform modules. Use these as starting points, not templates to copy blindly. Adapt to the actual requirement.

---

## Standard Module File Structure

```
module/
├── main.tf          # Primary resource declarations
├── variables.tf     # Input variable definitions
├── outputs.tf       # Output value definitions
├── versions.tf      # Terraform and provider version constraints
├── locals.tf        # Local value computations (add only if needed)
└── README.md        # Purpose, inputs, outputs, usage example
```

Only add `locals.tf` when it improves readability. Do not add files for the sake of neatness.

---

## versions.tf Pattern

Always pin to a specific minimum version. Use `mcp_terraform_get_latest_provider_version` to get the current latest before generating.

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 4.0.0"
    }
  }
}
```

**Guidance:**
- Use `>=` with a minimum — not an exact pin — to allow patch upgrades in the consumer
- Always include `required_version` for Terraform itself
- Add `azuread` or `random` only if the module genuinely needs them

---

## variables.tf Pattern

```hcl
# --- Required variables (no default) ---
variable "name" {
  description = "Name of the resource. Must be globally unique."
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group to deploy into."
  type        = string
}

variable "location" {
  description = "Azure region for the resource (e.g. 'uksouth', 'westeurope')."
  type        = string
}

# --- Optional variables (with safe defaults) ---
variable "sku" {
  description = "SKU tier for the resource. Defaults to Standard."
  type        = string
  default     = "Standard"

  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.sku)
    error_message = "sku must be one of: Basic, Standard, Premium."
  }
}

variable "tags" {
  description = "Map of tags to apply to all resources created by this module."
  type        = map(string)
  default     = {}
}

variable "diagnostic_settings" {
  description = "Optional diagnostic settings to forward logs and metrics to a Log Analytics workspace."
  type = object({
    enabled                    = bool
    log_analytics_workspace_id = optional(string)
    retention_days             = optional(number, 30)
  })
  default = {
    enabled = false
  }
}
```

**Guidance:**
- Group required variables first, optional variables after
- Every variable needs a `description`
- Use `validation` blocks for enum-style variables — avoid magic values
- Use `optional()` inside object types for partial configuration
- Avoid large `object()` variables that expose every possible resource argument

---

## outputs.tf Pattern

```hcl
output "id" {
  description = "Resource ID of the deployed resource."
  value       = azurerm_example.this.id
}

output "name" {
  description = "Name of the deployed resource."
  value       = azurerm_example.this.name
}

output "principal_id" {
  description = "Principal ID of the system-assigned managed identity."
  value       = azurerm_example.this.identity[0].principal_id
}
```

**Guidance:**
- Always output `id` — consumers almost always need it
- Output `name` — useful for reference
- Output `principal_id` if the resource has a managed identity
- Do not output every attribute — only those consumers realistically need
- Sensitive outputs (connection strings, keys) should use `sensitive = true`

---

## locals.tf Pattern

Use locals to construct names, derive values, or improve readability. Do not use locals to hide important logic.

```hcl
locals {
  # Construct a canonical name if the module applies naming conventions
  resource_name = lower("${var.prefix}-${var.workload}-${var.environment}-${var.location}-${var.instance}")

  # Merge caller tags with module-level defaults
  tags = merge(
    {
      managed-by  = "terraform"
      module      = "storage-account"
      environment = var.environment
    },
    var.tags
  )

  # Derive a boolean from a nullable optional
  enable_diagnostics = var.diagnostic_settings != null && var.diagnostic_settings.enabled
}
```

---

## Managed Identity Pattern

Always use managed identity over connection strings or keys where the resource supports it.

```hcl
resource "azurerm_storage_account" "this" {
  # ...

  identity {
    type = "SystemAssigned"
  }
}

output "principal_id" {
  description = "Principal ID of the system-assigned managed identity for RBAC assignments."
  value       = azurerm_storage_account.this.identity[0].principal_id
}
```

For modules that need to configure RBAC, accept `role_assignments` as a variable:

```hcl
variable "role_assignments" {
  description = "List of RBAC role assignments to create on the resource."
  type = list(object({
    principal_id         = string
    role_definition_name = string
  }))
  default = []
}

resource "azurerm_role_assignment" "this" {
  for_each = { for ra in var.role_assignments : ra.principal_id => ra }

  scope                = azurerm_storage_account.this.id
  role_definition_name = each.value.role_definition_name
  principal_id         = each.value.principal_id
}
```

---

## Diagnostic Settings Pattern

Standard pattern for forwarding logs and metrics to a Log Analytics Workspace.

```hcl
resource "azurerm_monitor_diagnostic_setting" "this" {
  count = var.diagnostic_settings.enabled ? 1 : 0

  name                       = "${azurerm_storage_account.this.name}-diagnostics"
  target_resource_id         = azurerm_storage_account.this.id
  log_analytics_workspace_id = var.diagnostic_settings.log_analytics_workspace_id

  enabled_log {
    category_group = "allLogs"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
```

**Guidance:**
- Make diagnostic settings optional (default off, enabled on request)
- Accept `log_analytics_workspace_id` as a variable — do not create a workspace inside the module
- Use `category_group = "allLogs"` as the default — simpler than per-category configuration

---

## Private Endpoint Pattern

Pass private endpoint configuration as an optional structured variable.

```hcl
variable "private_endpoint" {
  description = "Optional private endpoint configuration for the resource."
  type = object({
    enabled             = bool
    subnet_id           = optional(string)
    private_dns_zone_id = optional(string)
  })
  default = {
    enabled = false
  }
}

resource "azurerm_private_endpoint" "this" {
  count = var.private_endpoint.enabled ? 1 : 0

  name                = "${azurerm_storage_account.this.name}-pe"
  location            = azurerm_storage_account.this.location
  resource_group_name = azurerm_storage_account.this.resource_group_name
  subnet_id           = var.private_endpoint.subnet_id

  private_service_connection {
    name                           = "${azurerm_storage_account.this.name}-psc"
    private_connection_resource_id = azurerm_storage_account.this.id
    subresource_names              = ["blob"]
    is_manual_connection           = false
  }

  dynamic "private_dns_zone_group" {
    for_each = var.private_endpoint.private_dns_zone_id != null ? [1] : []

    content {
      name                 = "default"
      private_dns_zone_ids = [var.private_endpoint.private_dns_zone_id]
    }
  }
}
```

**Guidance:**
- Do not create the DNS zone inside the module — accept it as an ID
- Do not create the subnet inside the module — accept it as an ID
- Private endpoint is optional — default to disabled

---

## Tagging Pattern

Always merge caller tags with module-level defaults.

```hcl
variable "tags" {
  description = "Additional tags to apply to all resources. Module-level defaults are merged with these."
  type        = map(string)
  default     = {}
}

locals {
  tags = merge(
    {
      managed-by = "terraform"
    },
    var.tags
  )
}
```

Apply `local.tags` to every resource in the module.

---

## Example Usage Block (for README)

Every module README should include an example that can be copied and run.

```hcl
module "storage" {
  source = "git::https://github.com/your-org/terraform-modules.git//modules/storage-account?ref=v1.0.0"

  name                = "stmyappproduksouth001"
  resource_group_name = "rg-myapp-prod-uksouth-001"
  location            = "uksouth"

  sku = "Standard"

  tags = {
    environment = "prod"
    project     = "myapp"
    owner       = "platform-team"
    cost-center = "CC-12345"
  }

  diagnostic_settings = {
    enabled                    = true
    log_analytics_workspace_id = "/subscriptions/.../workspaces/law-myapp-prod"
    retention_days             = 30
  }

  private_endpoint = {
    enabled             = true
    subnet_id           = "/subscriptions/.../subnets/snet-pe-prod"
    private_dns_zone_id = "/subscriptions/.../privateDnsZones/privatelink.blob.core.windows.net"
  }
}
```

---

## Anti-Patterns to Avoid

| Anti-pattern | Problem | Better approach |
|---|---|---|
| Wrapping a single resource with no added value | Just adds complexity | Use the resource directly |
| Exposing all provider arguments as variables | Creates a maintenance burden and confusing interface | Expose only what consumers need |
| Creating DNS zones or VNets inside the module | Tight coupling, unusable in existing environments | Accept IDs as variables |
| Feature flag variables (`enable_feature_x = true/false`) | Modules become implicit frameworks | Separate modules for distinct patterns |
| `count`-based conditional resources with complex dependencies | Creates hard-to-debug plan outputs | Use `for_each` with a map or `null` checks |
| Hardcoded names | Prevents reuse across environments | Use variables for all names |
| Nested modules for a simple pattern | Over-abstraction | Flat structure is easier to read and maintain |
