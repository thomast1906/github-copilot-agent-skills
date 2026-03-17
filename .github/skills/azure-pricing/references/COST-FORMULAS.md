# Cost Estimation Formulas

Reference formulas for converting Azure unit prices into monthly and annual estimates when using the `azure-pricing` skill.

## Standard Time-Based Multipliers

Azure billing uses **730 hours/month** as the standard period (365 days × 24 hours ÷ 12 months).

| Period | Hours | Formula |
|--------|-------|---------|
| 1 Hour | 1 | Unit price |
| 1 Day | 24 | Unit price × 24 |
| 1 Month (always-on) | 730 | Unit price × 730 |
| 1 Month (business hours, 8h/day × 22 days) | 176 | Unit price × 176 |
| 1 Year | 8,760 | Unit price × 8,760 |
| 3 Years | 26,280 | Unit price × 26,280 |

> **Reservation prices are lump-sum totals, not hourly rates.** Despite `unitOfMeasure: "1 Hour"` in the API response, Reservation `retailPrice` values represent the total commitment cost for the full term. Divide by 8,760 (1-year) or 26,280 (3-year) to get a comparable hourly figure.

---

## Service-Specific Formulas

### Virtual Machines

```
Monthly (always-on)      = hourly_price × 730
Monthly (business hours) = hourly_price × 176   # 8h/day, 22 working days

Linux and Windows are separate SKUs with different prices.
Always query both if OS hasn't been confirmed.
```

**⚠️ Azure Hybrid Benefit:** Retail prices reflect full PAYG rates. AHB can reduce Windows VM and SQL Server costs by 40%+. Always flag this for Windows or SQL workloads.

**Spot pricing** (interrupt-tolerant workloads only):

Query via `filter: "contains(meterName, 'Spot') and armSkuName eq '<sku>' and armRegionName eq '<region>'"` with `price-type: Consumption`.

Live reference (uksouth, Standard_D4s_v5, tested March 2026):

| Type | Price/hr | Monthly est. | Saving vs PAYG |
|------|----------|-------------|----------------|
| Linux PAYG | £0.164 | £119.72 | — |
| Linux Spot | £0.0213 | £15.55 | ~87% |
| Windows PAYG | £0.300 | £219.00 | — |
| Windows Spot | £0.039 | £28.47 | ~87% |

Spot is not suitable for databases, persistent workloads, or anything that can't tolerate interruption with ~30 seconds notice.

---

### Azure App Service

```
Monthly = plan_price × 730   # all plans priced hourly
```

All App Service plans (Basic, Standard, Premium v3, Isolated) return `unitOfMeasure: "1 Hour"` in the API. Multiply the hourly `retailPrice` by 730 to get monthly cost for an always-on plan.

**SKU name spacing:** `P2v3` returns no results — the API stores it as `P2 v3`. If `sku` returns empty, use `filter: "skuName eq 'P2 v3' and serviceName eq 'Azure App Service'"`.

---

### Azure SQL Database

Two separate queries required — compute and storage are distinct meters.

```
Monthly compute = hourly_compute_price × 730
Monthly storage = price_per_GB_month × storage_GB
Monthly total   = Monthly compute + Monthly storage
```

**SKU format mismatch:** The ARM SKU `GP_Gen5_4` maps to `skuName: "4 vCore"` in the API. Filter by both `skuName` and `productName` (containing `General Purpose - Compute Gen5`) to avoid mixing General Purpose, Business Critical, and DC-Series rows.

---

### Azure Functions

Three-component cost — always ask about invocation volume before estimating.

```
Execution cost = price_per_execution × invocations_per_month
Compute cost   = price_per_GBs × (memory_GB × duration_seconds × invocations)
Total monthly  = Execution cost + Compute cost
```

**Free grant (Consumption plan):** 1 million executions and 400,000 GB-s per month are free. For low-volume functions, the actual cost may be £0.

---

### Azure Blob Storage

Three separate meters — a single query won't produce a single combined figure.

```
Storage cost     = price_per_GB × stored_GB
Transaction cost = price_per_10k_ops × (operations ÷ 10,000)
Egress cost      = price_per_GB × egress_GB
Monthly total    = Storage + Transactions + Egress
```

Ask about access pattern (Hot/Cool/Cold/Archive tier) — prices differ significantly between tiers.

---

### Azure Cosmos DB

**Provisioned throughput:**

```
Monthly = (RU_per_second ÷ 100) × price_per_100_RUs × 730
```

**Serverless:**

```
Monthly = (total_RUs_consumed ÷ 1,000,000) × price_per_million_RUs
```

Ask the user which model they're using and, for serverless, their expected RU consumption per month before estimating.

---

### Azure Container Apps

Cannot query via `service` parameter — use OData filter: `serviceName eq 'Azure Container Apps' and armRegionName eq '<region>'`. Pricing has three separate billing dimensions depending on plan type:

**Consumption plan (scale-to-zero):**
```
vCPU cost    = vCPU_price_per_second × vCPU_count × active_seconds_per_month
Memory cost  = memory_price_per_GiB_second × memory_GiB × active_seconds_per_month
Request cost = request_price_per_million × (requests_per_month ÷ 1,000,000)
Monthly total = vCPU + Memory + Request costs
```
Free grant on Consumption plan: 180,000 vCPU-seconds and 360,000 GiB-seconds per month. Low-traffic apps may have near-zero cost.

**Dedicated plan (always-on workload profiles):**
```
Monthly = (dedicated_vCPU_price × vCPU_count × 730)
        + (dedicated_memory_price × memory_GiB × 730)
        + dedicated_plan_management_price × 730
```

Ask about: minimum/maximum replicas, vCPU + memory per replica, and request volume before estimating Consumption plan costs.

---

### Azure Kubernetes Service (AKS)

```
Monthly = node_VM_price × 730 × node_count
```

The AKS control plane is free on the Standard tier. Factor in node pool VMs only. If autoscaling is in use, estimate against average node count rather than maximum.

---

## Reservation Savings Formula

```
Savings % = ((PAYG_price - Reserved_price) ÷ PAYG_price) × 100
```

Always present all pricing models side by side when Reservation or Savings Plan pricing is requested:

| Pricing Model | Monthly Cost | Annual Cost | Saving vs PAYG |
|---------------|-------------|-------------|----------------|
| Pay-As-You-Go | £X | £Y | — |
| 1-Year Reservation | £A | £B | Z% |
| 3-Year Reservation | £C | £D | W% |
| Savings Plan (1-yr) | £E | £F | V% |
| Spot (if applicable) | £G | N/A | T% |

---

## Pre-Estimation Clarifying Questions

Before querying for consumption-based services, ask:

| Service | What to ask |
|---------|-------------|
| Azure Functions | Invocations/month, avg execution time (ms), memory allocation (MB) |
| Cosmos DB (serverless) | Expected RU consumption/month |
| Blob Storage | Volume (GB), access tier, approx operations/month, egress (GB) |
| Container Apps | Expected request rate, min/max replicas, vCPU and memory per replica |
| AKS | Node count (or autoscale range), VM size per node pool |

For always-on, fixed-tier services (VMs, App Service Premium, SQL Database provisioned), no clarifying questions are needed — proceed with the pricing query.

---

## Known MCP Tool Limitation: AI Services

The Azure MCP pricing tool returns a **500 error** for any service in the `AI + Machine Learning` service family. This includes:

- `Foundry Models` (Azure OpenAI)
- `Azure OpenAI` (legacy service name)
- `service-family: "AI + Machine Learning"`
- Any OData filter that returns results from that family

**Workaround:** Direct users to:
- [Azure OpenAI Pricing](https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/)
- [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)

Token-based pricing formula (for reference once rates are obtained manually):

```
Monthly cost = (input_tokens ÷ 1,000) × input_price_per_1k
             + (output_tokens ÷ 1,000) × output_price_per_1k
```

Ask for expected prompt and completion token volumes per month before estimating.
