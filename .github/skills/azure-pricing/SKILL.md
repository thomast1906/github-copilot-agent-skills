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
> - **Spot pricing requires the `filter` parameter, not `price-type`.** Spot is not a `price-type` value — use `filter: "contains(meterName, 'Spot') and armSkuName eq '<sku>' and armRegionName eq '<region>'"` with `price-type: Consumption`. Live-tested: Standard_D4s_v5 in `uksouth` returns Linux Spot at £0.0213/hr and Windows Spot at £0.039/hr (vs £0.164/hr and £0.300/hr standard — ~87% saving).
> - **`isPrimaryMeterRegion eq true` in OData filter:** When using targeted `sku` + `region` queries, the MCP tool already returns only primary meter region rows. The `isPrimaryMeterRegion eq true` filter expression is useful when writing broad OData-only queries (without a locked region) that might otherwise return duplicate rows for the same SKU across meter variants.
> - **`include-savings-plan: true` is incompatible with the `filter` parameter.** When `include-savings-plan: true` is set alongside an OData `filter`, the tool returns empty results. To retrieve savings plan data, use `sku` + `region` parameters only. The `savingsPlan` field is a nested array (`[{"term": "1 Year", "unitPrice": ...}, {"term": "3 Years", ...}]`) present only on Linux compute rows — Windows VM rows never include savings plan data.
> - **`DevTestConsumption` waives the Windows OS license cost on VMs.** Windows VMs queried with `price-type: DevTestConsumption` return at Linux-equivalent prices (e.g. Standard_D4s_v5 uksouth: £0.164/hr, same as Linux PAYG). The Windows license is free under Dev/Test subscriptions. Always flag this when estimating costs for Dev/Test Windows VMs.
> - **`Reservation` queries always return both 1-year and 3-year rows together.** There is no `reservation-term` parameter — it is silently ignored. To isolate a single term, combine `price-type: Reservation` with `filter: "reservationTerm eq '1 Year'"` or `filter: "reservationTerm eq '3 Years'"`. Parameters `top`, `skip`, and `meter-name` are also silently ignored by the MCP tool.
> - **⚠️ Azure OpenAI / AI services cannot be queried via this MCP tool.** The Azure MCP pricing tool returns a 500 error for any query that resolves to the `AI + Machine Learning` service family — including `service: "Foundry Models"`, `service: "Azure OpenAI"`, `service-family: "AI + Machine Learning"`, and OData filters matching those services. This is a known MCP tool limitation. For AI model pricing (GPT-4o, text-embedding, etc.), use the [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/) or the [Azure OpenAI pricing page](https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/) directly.

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

**Pre-estimation: ask about usage patterns before querying** — for consumption-based services, the cost varies wildly based on scale. Before calling the pricing tool, if the template contains any of the following, ask the user:

| Service | Ask about |
|---------|----------|
| Azure Functions | Expected invocations/month, average execution duration (ms), memory allocation (GB) |
| Cosmos DB (serverless) | Expected RU consumption/month |
| Container Apps | Expected request volume, scale-to-zero behaviour, vCPU/memory allocation |
| Azure OpenAI | Note: AI service pricing is not queryable via this MCP tool — direct users to the [Azure OpenAI pricing page](https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/) |

For always-on services (VMs, App Service, SQL Database), proceed directly with the pricing query.

1. Parse the template to identify all resource types and their SKUs/tiers.
2. For each resource, call the pricing tool with the appropriate `sku` and/or `service` + `region`.
3. Aggregate results into a total monthly **and annual** cost estimate (`monthly × 12`).
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
- **Spot pricing:** `filter: "contains(meterName, 'Spot') and armSkuName eq 'Standard_D4s_v5' and armRegionName eq 'uksouth'"` with `price-type: Consumption` — returns Linux and Windows Spot rows separately
- **Primary meter only (broad queries):** `filter: "serviceName eq 'Virtual Machines' and armRegionName eq 'uksouth' and isPrimaryMeterRegion eq true"` — avoids duplicate rows when not using a specific SKU

> **Note:** Avoid OData filters that resolve to `serviceFamily eq 'AI + Machine Learning'` — the MCP tool will return a 500 error. See AI services note in Gotchas above.

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
| Annual Est. | ~[from tool]/year |
| Currency | GBP |

**Spot:** [from tool]/hour ([x]% saving vs Consumption) — interrupt-tolerant workloads only
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

| Resource | SKU / Tier | Monthly Cost | Annual Cost |
|----------|-----------|-------------|-------------|
| App Service Plan | P2v3 | £240.00 | £2,880.00 |
| Azure SQL Database | GP_Gen5_4 | £304.00 | £3,648.00 |
| Storage Account | Standard_LRS | £15.00 | £180.00 |
| Application Insights | Pay-as-you-go | ~£8.00 | ~£96.00 |
| **Total** | | **~£567/month** | **~£6,804/year** |

> Note: Estimates based on retail (pay-as-you-go) pricing. Reserved instances or savings plans can reduce this by 20-70%.

**Cost Reduction Opportunities:**
- Switch App Service Plan to 1-year reservation: save ~£72/month
- SQL Database 1-year reservation: save ~£122/month
- **Total potential savings with reservations: ~£194/month (34%) / ~£2,328/year**
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

| Azure Service | `service` Parameter Value | Notes |
|---------------|--------------------------|-------|
| Virtual Machines | `Virtual Machines` | |
| App Service | `Azure App Service` | |
| Azure SQL Database | `SQL Database` | |
| Azure Cosmos DB | `Azure Cosmos DB` | |
| Azure Kubernetes Service | `Azure Kubernetes Service` | |
| Azure Functions | `Azure Functions` | |
| Storage (Blob/Queue/Table) | `Storage` | |
| Azure Cache for Redis | `Redis Cache` | API service name differs from portal display name |
| Service Bus | `Service Bus` | |
| Event Hubs | `Event Hubs` | |
| API Management | `API Management` | |
| Application Gateway | `Application Gateway` | |
| Azure Front Door | `Azure Front Door` | |
| Log Analytics | `Log Analytics` | |
| Application Insights | `Application Insights` | |
| Azure Container Apps | `Azure Container Apps` | ⚠️ **Cannot use `service` parameter** — tool returns 400 (no ARM SKU). Use `filter: "serviceName eq 'Azure Container Apps' and armRegionName eq '<region>'"`  instead. Multi-unit pricing (vCPU/sec, GiB-sec, requests/1M) — always ask about usage before estimating |
| Azure OpenAI / Foundry Models | `Foundry Models` | ⚠️ **Not queryable via MCP tool** — `AI + Machine Learning` service family causes 500 error. Use [Azure OpenAI pricing page](https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/) directly |

## Price Type Guide

| Price Type | When to Use |
|-----------|-------------|
| `Consumption` | Default pay-as-you-go; no commitment |
| `Reservation` | 1-year or 3-year committed use; 20-72% off |
| `DevTestConsumption` | Dev/Test subscriptions; discounted non-prod rates |

## Error Handling

If the pricing tool returns no results:
1. **Consult [SKU Name Quirks](references/SKU-NAME-QUIRKS.md)** — the API `skuName` often differs from the ARM/portal/IaC name (e.g. `P2v3` → `P2 v3`, `GP_Gen5_4` → `4 vCore`, `C1` → `C1 Cache Instance`).
2. Try broadening the query (remove SKU, keep only service + region).
3. Verify the service name matches the Common Service Name Reference above.
4. Try the `filter` parameter with an OData expression — this is more reliable than the `sku` parameter for services where the API `skuName` format differs from the portal/ARM name (e.g. App Service, SQL Database).
5. If `skuName` format is unknown, query without it first to see what `skuName` values are returned, then narrow.
6. If service name is unknown, use `service-family` alone (e.g. `service-family: Compute`, `service-family: Databases`) to discover what `serviceName` values exist in that family, then re-query with the correct name.
7. Inform the user if pricing is unavailable for a specific SKU and suggest the nearest alternative.

If the pricing tool returns a **500 error**:
- Check whether the query would resolve to `serviceFamily eq 'AI + Machine Learning'`. If so, this is a known MCP tool limitation — redirect the user to the [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/) or [Azure OpenAI pricing page](https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/).

## Reference Documentation

- [Azure Pricing MCP Tool](https://learn.microsoft.com/en-us/azure/developer/azure-mcp-server/tools/azure-pricing)
- [Azure Retail Prices API](https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices)
- [Azure Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/)
- [Azure Reservations](https://learn.microsoft.com/en-us/azure/cost-management-billing/reservations/save-compute-costs-reservations)
- [Azure Savings Plans](https://learn.microsoft.com/en-us/azure/cost-management-billing/savings-plan/savings-plan-compute-overview)
- [Azure OpenAI Pricing](https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/) *(use directly — not queryable via MCP tool)*
- [Cost Estimation Formulas](references/COST-FORMULAS.md) *(service-specific formulas, Spot pricing reference, pre-estimation guidance)*
- [SKU Name Quirks](references/SKU-NAME-QUIRKS.md) *(ARM → API skuName mappings for App Service, SQL Database, Redis, Storage, APIM, Container Apps)*
