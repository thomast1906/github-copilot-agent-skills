---
name: azure-pricing
description: Look up real-time Azure retail pricing for any service, SKU, or region using the Azure MCP pricing tool. Estimate deployment costs from Bicep, ARM, or Terraform templates, compare pricing across regions, price types (Consumption, Reservation, DevTest), and surface savings plan options. Use when asked about Azure costs, SKU prices, region comparisons, or template cost estimates.
---

# Azure Pricing Skill

Fetch live Azure retail pricing data via the Azure MCP Server pricing tool and turn it into actionable cost estimates, region comparisons, and deployment-level forecasts.

## When to Use

- "How much does `Standard_D4s_v5` cost in `uksouth`?"
- "Estimate the cost of this Bicep/ARM/Terraform template"
- "Compare VM pricing between `uksouth` and `westeurope`"
- "Show me Reservation vs Consumption pricing for SQL Database"
- "What are the cheapest storage SKUs in `uksouth`?"
- "Include savings plan pricing for this compute tier"
- Any request for Azure pricing, cost estimates, or SKU comparisons

## Required Tooling

- **MCP tool**: Azure pricing tool provided by the **Azure VS Code extension** (`ms-azuretools.vscode-azure-github-copilot`). No `mcp.json` configuration is required — the tool is registered automatically by the extension.

> Before invoking the pricing tool, always run `tool_search_tool_regex` with pattern `pricing` to discover the exact tool name. Do **not** guess or hardcode the name.

## Tool Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `sku` | Optional* | ARM SKU name (e.g. `Standard_D4s_v5`, `Standard_E64-16ds_v4`) |
| `service` | Optional* | Azure service name (e.g. `Virtual Machines`, `Storage`, `SQL Database`) |
| `region` | Optional* | Azure region slug (e.g. `eastus`, `westeurope`, `westus2`) |
| `service-family` | Optional* | Service family (e.g. `Compute`, `Storage`, `Databases`, `Networking`) |
| `price-type` | Optional* | `Consumption`, `Reservation`, or `DevTestConsumption` |
| `include-savings-plan` | Optional | `true` to include savings plan pricing (uses preview API; mainly applies to Linux VMs) |
| `filter` | Optional* | Raw OData filter expression for advanced queries |
| `currency` | Optional | Currency code. **Skill default: `GBP`** — always pass this explicitly. The underlying tool defaults to `USD` if omitted. Other common values: `USD`, `EUR` |

> *At least one filter parameter is required per call.

> **Gotchas:**
> - `SavingsPlan` is **NOT** a valid `price-type` value. To get savings plan rates use `include-savings-plan: true` alongside a `Consumption` query.
> - Prefer querying with a specific SKU rather than a broad service name alone — results will be more targeted and useful. Querying by service name without a SKU is valid when the user explicitly wants a full listing of available SKUs.
> - **SKU name spacing varies by service.** The `sku` parameter is format-sensitive. For App Service, `P2v3` returns no results but `P2 v3` (with a space) works. If the `sku` parameter returns empty, fall back to an OData `filter` with `skuName eq '...'` to match exactly as the API stores it.
> - **Reservation `retailPrice` values are lump-sum totals, not hourly rates.** Despite `unitOfMeasure: "1 Hour"`, Reservation price rows return the total commitment cost (annual or 3-year). Divide by 8,760 (1-year) or 26,280 (3-year) to get an hourly equivalent for comparison.
> - **SQL Database compute and storage are separate meters.** You need two calls: one for compute (e.g. `4 vCore` under `SQL Database Single/Elastic Pool General Purpose - Compute Gen5`) and one for storage (`SQL Database Single/Elastic Pool General Purpose - Storage`). A single query returns both if you don't filter by `productName`.
> - **SQL Database `skuName` in the API uses plain English, not ARM format.** The ARM SKU `GP_Gen5_4` maps to API `skuName: "4 vCore"` under `productName` containing `General Purpose - Compute Gen5`. Filter by both `skuName` and `productName` to avoid Business Critical or DC-Series rows returning alongside General Purpose.

## Workflow

### Scenario 1: Single SKU / Service Price Lookup

1. Extract the SKU, service name, or region from the user's request.
2. **Prefer a specific SKU or tier.** If the user hasn't provided one and a full SKU listing isn't what they're after, ask for clarification before calling the tool.
3. Call the pricing tool with the identified parameters.
4. Present the result as a formatted price table (see Output Format below).

**Example prompts to tool:**
- SKU in region: `{ "sku": "Standard_D4s_v5", "region": "uksouth", "currency": "GBP" }`
- With reservation comparison: `{ "sku": "Standard_D4s_v5", "region": "uksouth", "price-type": "Reservation", "currency": "GBP" }`
- With savings plan (Linux VMs only): `{ "sku": "Standard_D4s_v5", "region": "uksouth", "include-savings-plan": true, "currency": "GBP" }`

> Note: Calling with `service` alone (e.g. `"service": "Virtual Machines"`) without a `sku` returns all SKUs for that service — only do this if the user explicitly wants a full listing.

### Scenario 2: Template Cost Estimation (Bicep / ARM / Terraform)

1. Parse the template to identify all resource types and their SKUs/tiers.
2. For each resource, call the pricing tool with the appropriate `sku` and/or `service` + `region`.
3. Aggregate results into a total monthly cost estimate.
4. Flag any resources where pricing could not be retrieved.

**Common Terraform resource mappings (examples — not exhaustive):**
- `azurerm_app_service_plan` → `sku_name` (e.g. `P1v3`)
- `azurerm_linux_virtual_machine` / `azurerm_windows_virtual_machine` → `size` (e.g. `Standard_D4s_v5`)
- `azurerm_mssql_database` → `sku_name` (e.g. `GP_Gen5_4`)
- `azurerm_storage_account` → `account_tier` + `account_replication_type` (e.g. `Standard_LRS`)
- `azurerm_cosmosdb_account` → throughput settings
- `azurerm_kubernetes_cluster` → `default_node_pool.vm_size` × node count
- `azurerm_redis_cache` → `sku_name` + `family` + `capacity`
- `azurerm_servicebus_namespace` → `sku`
- `azurerm_api_management` → `sku_name`
- `azurerm_container_app_environment` + `azurerm_container_app` → `workload_profile` / `cpu` + `memory`

**Common Bicep/ARM resource mappings (examples — not exhaustive):**
- App Service Plans → SKU name (e.g. `P1v3`, `P2v3`)
- Virtual Machines → VM size (e.g. `Standard_D4s_v5`)
- Azure SQL → Service tier + compute size (e.g. `GP_Gen5_4`)
- Storage Accounts → SKU + redundancy (e.g. `Standard_LRS`, `Premium_ZRS`)
- Cosmos DB → Provisioned throughput (RU/s)
- Azure Kubernetes Service → Node VM size × node count
- Container Apps → workload profile + vCPU/memory allocation
- API Management → SKU tier (e.g. `Developer`, `Premium`)

> **⚠️ Azure Hybrid Benefit (AHB):** The retail pricing API returns pay-as-you-go rates and **never** reflects Azure Hybrid Benefit discounts. AHB can reduce costs by 40%+ for Windows VMs and SQL Server workloads. Always flag this when estimating costs for Windows or SQL resources, and direct users to the [Azure Hybrid Benefit calculator](https://azure.microsoft.com/pricing/hybrid-benefit/) for accurate figures.

### Scenario 3: Region Comparison

1. Extract the service/SKU from the request.
2. Call the pricing tool once per region to compare.
3. Present a comparison table sorted by price (ascending).

**Recommended region set for comparisons:**
- `uksouth`, `ukwest`, `westeurope`, `northeurope`, `eastus`, `eastus2` etc

### Scenario 4: Price Type Comparison (Consumption vs Reservation)

1. Fetch `Consumption` pricing first.
2. Fetch `Reservation` pricing for the same SKU/service (set `price-type: Reservation`).
3. If requested, include savings plan by passing `include-savings-plan: true` on the Consumption call (savings plan pricing is surfaced as a nested array on each result — applies mainly to Linux VMs).
4. Present a side-by-side comparison with calculated savings percentages.

> **Reminder:** `SavingsPlan` is **not** a valid `price-type`. Always use `include-savings-plan: true` flag for savings plan rates.

### Scenario 5: Advanced / OData Filter

Use the `filter` parameter for complex queries:
- Specific meter: `meterId eq 'abc-123'`
- Price range: `retailPrice le 0.10`
- Combined: `serviceName eq 'Storage' and skuName eq 'LRS' and armRegionName eq 'eastus'`

## Output Format

> These are reference templates — adapt the format to context. A quick inline answer may need only a line or two; a full architecture document warrants the complete table format.

### Single Price Lookup

```markdown
## Azure Pricing: [Service/SKU]

| Field | Value |
|-------|-------|
| Service | Virtual Machines |
| SKU | Standard_D4s_v5 |
| Region | UK South |
| Price Type | Consumption |
| Retail Price | [from tool]/hour |
| Monthly Est. | ~[from tool]/month (730 hrs) |
| Currency | GBP |

**Savings Plan (1-year):** [from tool]/hour ([x]% saving vs Consumption)
**1-Year Reservation:** [from tool]/hour ([x]% saving)
**3-Year Reservation:** [from tool]/hour ([x]% saving)
```

### Template Cost Estimate

```markdown
## Deployment Cost Estimate
**Template**: [filename or description]
**Region**: uksouth
**Currency**: GBP

| Resource | SKU / Tier | Monthly Cost |
|----------|-----------|-------------|
| App Service Plan | P2v3 | £240.00 |
| Azure SQL Database | GP_Gen5_4 | £304.00 |
| Storage Account | Standard_LRS | £15.00 |
| Application Insights | Pay-as-you-go | ~£8.00 |
| **Total** | | **~£567/month** |

> Note: Estimates based on retail (pay-as-you-go) pricing. Reserved instances or savings plans can reduce this by 20-70%.

**Cost Reduction Opportunities:**
- Switch App Service Plan to 1-year reservation: save ~£72/month
- SQL Database 1-year reservation: save ~£122/month
- **Total potential savings with reservations: ~£194/month (34%)**
```

### Region Comparison Table

```markdown
## Region Price Comparison: Standard_D4s_v5 (Consumption)

| Region | Price/Hour | Monthly Est. | vs Cheapest |
|--------|-----------|-------------|-------------|
| UK South | £0.158 | £115 | baseline |
| UK West | £0.165 | £121 | +4% |
| North Europe | £0.166 | £121 | +5% |
| West Europe | £0.173 | £126 | +10% |
| East US | £0.158 | £115 | 0% |
| Australia East | £0.212 | £155 | +34% |

**Recommendation**: `uksouth` offers the lowest cost within the UK for this SKU.
```

## Integration with Other Skills

| Scenario | Combine With |
|----------|-------------|
| Full architecture cost estimate | `architecture-design` skill |
| Identify expensive resources in existing deployments | `cost-optimization` skill |
| WAF cost pillar review | `waf-assessment` skill |
| IaC with cost-aware service selection | `architecture-design` + `azure-pricing` |
| Terraform cost estimation | Parse `.tf` files, call pricing tool per resource, aggregate in GBP |

## Common Service Name Reference

The table below covers frequently used services — use the service name exactly as shown. For services not listed, try the exact Azure portal display name or use the `filter` parameter with an OData expression.

| Azure Service | `service` Parameter Value |
|---------------|--------------------------|
| Virtual Machines | `Virtual Machines` |
| App Service | `Azure App Service` |
| Azure SQL Database | `SQL Database` |
| Azure Cosmos DB | `Azure Cosmos DB` |
| Azure Kubernetes Service | `Azure Kubernetes Service` |
| Azure Functions | `Azure Functions` |
| Storage (Blob/Queue/Table) | `Storage` |
| Azure Cache for Redis | `Azure Cache for Redis` |
| Service Bus | `Service Bus` |
| Event Hubs | `Event Hubs` |
| API Management | `API Management` |
| Application Gateway | `Application Gateway` |
| Azure Front Door | `Azure Front Door` |
| Log Analytics | `Log Analytics` |
| Application Insights | `Application Insights` |

## Price Type Guide

| Price Type | When to Use |
|-----------|-------------|
| `Consumption` | Default pay-as-you-go; no commitment |
| `Reservation` | 1-year or 3-year committed use; 20-72% off |
| `DevTestConsumption` | Dev/Test subscriptions; discounted non-prod rates |

## Error Handling

If the pricing tool returns no results:
1. Try broadening the query (remove SKU, keep only service + region).
2. Verify the service name matches the Common Service Name Reference above.
3. Try the `filter` parameter with an OData expression — this is more reliable than the `sku` parameter for services where the API `skuName` format differs from the portal/ARM name (e.g. App Service, SQL Database).
4. If `skuName` format is unknown, query without it first to see what `skuName` values are returned, then narrow.
5. Inform the user if pricing is unavailable for a specific SKU and suggest the nearest alternative.

## Reference Documentation

- [Azure Pricing MCP Tool](https://learn.microsoft.com/en-us/azure/developer/azure-mcp-server/tools/azure-pricing)
- [Azure Retail Prices API](https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices)
- [Azure Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/)
- [Azure Reservations](https://learn.microsoft.com/en-us/azure/cost-management-billing/reservations/save-compute-costs-reservations)
- [Azure Savings Plans](https://learn.microsoft.com/en-us/azure/cost-management-billing/savings-plan/savings-plan-compute-overview)
