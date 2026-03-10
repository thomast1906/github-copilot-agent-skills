---
name: terraform-provider-upgrade
description: Safe Terraform provider upgrades with automatic resource migration, breaking change detection, and state management using moved blocks. Use when upgrading provider versions, handling removed resources, migrating deprecated syntax, or performing major version upgrades.
metadata:
  author: github-copilot-skills-terraform
  version: "1.0.0"
  category: terraform-maintenance
---

# Terraform Provider Upgrade Skill

This skill provides a comprehensive workflow for safely upgrading Terraform providers with automatic resource migration, breaking change detection, and proper state management.

## When to Use This Skill

- **Upgrading provider versions** (especially major versions)
- **Handling removed or deprecated resources** 
- **Migrating between resource types** (e.g., `azurerm_sql_*` → `azurerm_mssql_*`)
- **Detecting and resolving breaking changes**
- **Replacing deprecated provider properties**
- **Managing Terraform state during upgrades**

## Determining Breaking vs Non-Breaking Changes

### Version Change Analysis

**Use MCP tools to understand the scope:**

```bash
# Step 1: Get current and latest versions
mcp_terraform_get_latest_provider_version(namespace="hashicorp", name="azurerm")
# Current: 3.117.0, Latest: 4.51.0 → Major version change (likely breaking)
# Current: 3.117.0, Latest: 3.118.0 → Minor version change (likely non-breaking)
# Current: 3.117.0, Latest: 3.117.1 → Patch version (non-breaking)

# Step 2: Discover available guide names
mcp_terraform_get_provider_capabilities(namespace="hashicorp", name="azurerm", version="latest")

# Step 3: Get the provider_doc_id for the upgrade guide
mcp_terraform_search_providers(provider_namespace="hashicorp", provider_name="azurerm", service_slug="4.0-upgrade-guide", provider_document_type="guides", provider_version="latest")

# Step 4: Fetch the upgrade guide content
mcp_terraform_get_provider_details(provider_doc_id="<id-from-search_providers>")
```

### Non-Breaking Changes (Auto-Apply)

**Characteristics:**
- Minor or patch version updates (e.g., `3.117.0` → `3.118.0` or `3.117.1`)
- No removed resources
- No required argument changes
- Backward-compatible deprecations with drop-in replacements
- New optional arguments or bug fixes

**Action:**
1. Update version constraints in `versions.tf`
2. Apply backward-compatible deprecation replacements if any
3. Commit changes without detailed documentation
4. Brief commit message: `chore: upgrade azurerm provider to v3.118.0`

### Breaking Changes (Apply + Document)

**Characteristics:**
- Major version updates (e.g., `3.x` → `4.x`)
- Removed resources requiring code migration
- Required argument changes (renames, type changes)
- Default value changes affecting behavior
- Authentication or provider configuration changes

**Action:**
1. Apply ALL code changes (resource migrations, moved blocks, argument updates)
2. Create comprehensive documentation at repository root: `TERRAFORM_UPGRADE_BREAKING_CHANGES.md`
3. Document what was done (not what needs to be done)
4. Detailed commit message referencing documentation

### Using MCP Tools to Identify Breaking Changes

**Key indicators from upgrade guide:**
- Sections titled "Removed Resources", "Breaking Changes", "Behavior Changes"
- Resources listed as "removed" or "superseded by"
- Arguments marked as "renamed", "removed", or "type changed"
- Default value changes that affect existing behavior

## Core Workflow

### 1. Inventory Current State

**Objective:** Find all provider references and document current versions

```bash
# Search for all Terraform files
find . -name "*.tf"

# Search for provider version constraints
grep -r "required_providers" --include="*.tf"
grep -r "version.*=" --include="versions.tf"
```

**Document:**
- Current provider versions across all modules/environments
- Location of all provider version constraints
- Environments using the provider

### 2. Check Latest Versions

**Use MCP Tool:**
```bash
mcp_terraform_get_latest_provider_version(namespace="hashicorp", name="azurerm")
```

**Compare:**
- Current version: `3.117.1`
- Latest version: `4.51.0`
- Gap: Major version upgrade (3.x → 4.x)

### 3. Research Breaking Changes

**Step 1: Discover Available Guides**
```bash
mcp_terraform_get_provider_capabilities(
  namespace="hashicorp",
  name="azurerm",
  version="latest"
)
```

**Step 2: Get the provider_doc_id for the Upgrade Guide**
```bash
mcp_terraform_search_providers(
  provider_namespace="hashicorp",
  provider_name="azurerm",
  service_slug="4.0-upgrade-guide",
  provider_document_type="guides",
  provider_version="latest"
)
```

**Step 3: Fetch Upgrade Guide Content**
```bash
mcp_terraform_get_provider_details(
  provider_doc_id="<id-from-search_providers>"
)
```

**Analyze upgrade guide for:**
- ✅ **Removed resources** (resources that no longer exist)
- ✅ **Deprecated resources** (warnings only)
- ✅ **Breaking argument changes** (required fields, renamed fields, type changes)
- ✅ **New provider features** (changes to features {} block)
- ✅ **Authentication changes**

### 4. Scan Codebase for Removed Resources

**Critical Step:** Build the list of removed resources from the upgrade guide fetched in Step 3, then scan the entire codebase for every one of them.

**Step 1: Extract removed resource names from the upgrade guide**

Parse the upgrade guide content for resources explicitly marked as *removed*, *deleted*, or *superseded*. Build a complete list — do **not** assume only a few resources changed. Major version upgrades often remove dozens of resources across multiple service categories.

**Step 2: Search for every removed resource**

```bash
# Generate a single regex alternation from ALL removed resources found in the upgrade guide
# Replace the values inside the parentheses with the actual list from the guide
REMOVED_RESOURCES=(
  "old_resource_type_1"
  "old_resource_type_2"
  "old_resource_type_3"
  # ... add every resource listed as removed in the upgrade guide
)

# Build a regex pattern and search all .tf files at once
PATTERN=$(IFS="|"; echo "${REMOVED_RESOURCES[*]}")
grep -rE "($PATTERN)" --include="*.tf" -l   # list affected files
grep -rE "($PATTERN)" --include="*.tf"       # show full context
```

```bash
# Alternatively, search for any resource block whose type begins with the
# provider prefix (e.g. azurerm_) and cross-reference against the removed list
grep -rE '^\s*resource\s+"<provider_prefix>[^"]+"' --include="*.tf"
```

> **Tip:** If the upgrade guide groups removals by service area (e.g. SQL, Compute, Networking), scan each group separately so findings are easier to triage.

**Step 3: Repeat for deprecated data sources and provider arguments**

The upgrade guide may also list deprecated **data sources** and **provider block arguments** separately. Run equivalent scans for those:

```bash
# Check for removed data source types
grep -rE 'data\s+"(old_data_source_1|old_data_source_2)"' --include="*.tf"

# Check for deprecated provider block arguments
grep -rE '(deprecated_argument_1|deprecated_argument_2)\s*=' --include="*.tf" -l
```

**Document findings:**
- Which files use removed resources
- Which environments are affected
- Dependencies between resources

### 5. Validate Argument Changes

**For each removed resource found:**

**Step 1: Search for old resource documentation**
```bash
mcp_terraform_search_providers(
  provider_namespace="hashicorp",
  provider_name="azurerm",
  service_slug="sql_server",
  provider_document_type="resources",
  provider_version="3.117.1"
)
mcp_terraform_get_provider_details(provider_doc_id="<id-from-search>")
```

**Step 2: Search for new resource documentation**
```bash
mcp_terraform_search_providers(
  provider_namespace="hashicorp",
  provider_name="azurerm",
  service_slug="mssql_server",
  provider_document_type="resources",
  provider_version="latest"
)
mcp_terraform_get_provider_details(provider_doc_id="<id-from-search>")
```

**Step 3: Compare schemas**
- Required arguments (new required fields?)
- Renamed arguments (e.g., `administrator_login` → `admin_login`)
- Type changes (name → ID references)
- Removed arguments
- New arguments with defaults

**Step 4: Check default values**
- Document if new resource has different defaults than old resource
- Example: New resource might enable features by default that old resource didn't

### 6. Apply Code Migrations

**Update resource types:**
```hcl
# Before
resource "azurerm_sql_server" "sql_server" {
  name                         = "example-sqlserver"
  resource_group_name          = azurerm_resource_group.rg.name
  location                     = azurerm_resource_group.rg.location
  version                      = "12.0"
  administrator_login          = "sqladmin"
  administrator_login_password = var.sql_password
}

# After
resource "azurerm_mssql_server" "sql_server" {
  name                         = "example-sqlserver"
  resource_group_name          = azurerm_resource_group.rg.name
  location                     = azurerm_resource_group.rg.location
  version                      = "12.0"
  administrator_login          = "sqladmin"
  administrator_login_password = var.sql_password
}
```

**Add moved block for state migration:**
```hcl
moved {
  from = azurerm_sql_server.sql_server
  to   = azurerm_mssql_server.sql_server
}
```

**Update argument changes:**
```hcl
# Firewall rule arguments changed from name-based to ID-based
# Before (v3.x)
resource "azurerm_sql_firewall_rule" "allow_azure" {
  name                = "allow-azure-services"
  resource_group_name = azurerm_resource_group.rg.name
  server_name         = azurerm_sql_server.sql_server.name
  start_ip_address    = "0.0.0.0"
  end_ip_address      = "0.0.0.0"
}

# After (v4.x)
resource "azurerm_mssql_firewall_rule" "allow_azure" {
  name             = "allow-azure-services"
  server_id        = azurerm_mssql_server.sql_server.id  # Changed from name to ID
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

moved {
  from = azurerm_sql_firewall_rule.allow_azure
  to   = azurerm_mssql_firewall_rule.allow_azure
}
```

**Update dependent resources:**
```bash
# Search for resources that reference the migrated resource
grep -r "azurerm_sql_server.sql_server" --include="*.tf"
```

Update references to use correct attributes (e.g., `.id` instead of `.name` where needed).

**Replace deprecated provider properties:**
```hcl
# Before
provider "azurerm" {
  features {}
  skip_provider_registration = true  # Deprecated
}

# After
provider "azurerm" {
  features {}
  resource_provider_registrations = "none"  # Modern equivalent
}
```

**Update version constraints:**
```hcl
terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "4.51.0"  # Updated from 3.117.1
    }
  }
}
```

### 7. Document Changes

**Only create documentation for breaking changes.**

Create `TERRAFORM_UPGRADE_BREAKING_CHANGES.md` at **repository root** (not in `.github/` or subdirectories):

**File Location:**
```
your-terraform-repo/
├── TERRAFORM_UPGRADE_BREAKING_CHANGES.md  ← Place here
├── infra/
├── .github/
└── README.md
```

```markdown
# Terraform Provider Upgrade: AzureRM v3.117.1 → v4.51.0

**Date:** 2026-01-27

## Summary

Upgraded HashiCorp AzureRM provider from v3.117.1 to v4.51.0. This major version upgrade included automatic migration of removed SQL resources to their modern MSSQL equivalents.

## What Changed

- Updated `required_providers` version constraint to `4.51.0`
- Migrated removed resources: `azurerm_sql_*` → `azurerm_mssql_*`
- Replaced deprecated `skip_provider_registration` with `resource_provider_registrations`
- Updated argument references from name-based to ID-based

## Breaking Changes Handled

### ✅ Removed Resources Migrated

**1. azurerm_sql_server → azurerm_mssql_server**
- **Files Modified:** `infra/modules/database/main.tf`
- **Changes Applied:**
  - Updated resource type
  - Added `moved` block for automatic state migration
  - All arguments remain compatible
- **Argument Mappings:** No changes required (schema compatible)
- **Default Values:** No new default value changes
- **Documentation:** [azurerm_mssql_server](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/mssql_server)

**2. azurerm_sql_firewall_rule → azurerm_mssql_firewall_rule**
- **Files Modified:** `infra/modules/database/main.tf`
- **Changes Applied:**
  - Updated resource type
  - Changed `server_name` argument to `server_id`
  - Updated reference from `.name` to `.id`
  - Added `moved` block for automatic state migration
- **Argument Mappings:**
  - `resource_group_name` (removed) + `server_name` → `server_id`
  - Now uses: `azurerm_mssql_server.sql_server.id`
- **Default Values:** No new default value changes
- **Documentation:** [azurerm_mssql_firewall_rule](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/mssql_firewall_rule)

**State Migration:** Terraform will automatically migrate state using `moved` blocks on next plan/apply.

## Notes

- All changes are backward compatible with existing state
- `moved` blocks enable automatic state migration
- No manual `terraform state mv` commands required
- Provider block retained with updated `resource_provider_registrations` argument

## Next Steps

1. **Commit these changes** to a feature branch
2. **Run your Terraform workflow** via CI/CD pipeline to validate
3. **Review plan output** to confirm state migrations
4. **Verify no unexpected changes** before merging

## References

- [AzureRM Provider 4.0 Upgrade Guide](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/guides/4.0-upgrade-guide)
- [AzureRM Provider v4.51.0 Release Notes](https://github.com/hashicorp/terraform-provider-azurerm/releases/tag/v4.51.0)
- [Terraform Moved Blocks](https://developer.hashicorp.com/terraform/language/modules/develop/refactoring)
- [Resource Provider Registrations](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/guides/4.0-upgrade-guide#resource-provider-registrations)
```

## Best Practices

### ✅ DO:
- **Distinguish upgrade types** - Check if major (breaking) vs minor/patch (non-breaking)
- **Auto-apply non-breaking** - Minor/patch updates don't need detailed documentation
- **Document breaking only** - Create TERRAFORM_UPGRADE_BREAKING_CHANGES.md for major versions
- **Place docs at root** - Repository root for visibility, not in subdirectories
- **Use moved blocks** for resource type changes (automatic state migration)
- **Validate arguments** against official docs for both old and new resources
- **Check default values** - document if new resource has different defaults
- **Update dependent resources** that reference migrated resources
- **Document what was done** - show code changes applied
- **Include resource documentation links** for transparency
- **Use pipeline validation** - let CI/CD handle terraform commands

### ❌ DON'T:
- **Document non-breaking changes** - Minor/patch versions don't need TERRAFORM_UPGRADE_BREAKING_CHANGES.md
- **Provide manual migration steps** - code should handle everything
- **Assume arguments stayed the same** - always validate schemas
- **Forget dependent resources** - search and update references
- **Miss attribute changes** - update `.name` to `.id` where needed
- **Remove provider blocks** - only update deprecated arguments
- **Suggest terraform commands** - users validate via pipeline

## Additional Resources

For detailed examples, common patterns, and troubleshooting, see the [reference guide](references/REFERENCE.md).
