# Worked Example: Decision Record and HLD Excerpt

This is a formatting reference, not a source of facts. Every service name, SKU, limit, URL, and price below is an illustrative placeholder showing the expected shape of a decision — not current Azure behaviour or pricing. Always populate the real version from live `azure-mcp/get_azure_bestpractices`, `azure-mcp/documentation`, `azure-mcp/wellarchitectedframework`, and `azure-pricing` output.

## Scenario used in this example

Internal expense-approval web app. ~500 concurrent users, business-hours usage pattern, existing Azure AD tenant, 99.9% availability target, no containerisation experience on the team, moderate budget, UK data residency. A mobile app launching next quarter will add bursty, higher-volume writes from field staff submitting expenses offline-first.

## Architecture Decisions table (two filled-in rows)

| Item | Include |
|---|---|
| Decision | App Service (Premium v3, P1v3), UK South, single region with zone redundancy |
| Rationale | Managed web app with no container/orchestration requirement; team has no Kubernetes operational experience; zone redundancy meets the stated 99.9% target per the retrieved SLA documentation |
| Alternatives | Container Apps — rejected: no containerisation need, adds operational surface without a corresponding benefit for this workload. AKS — rejected: scale and team expertise don't justify cluster operations |
| Constraints | Zone redundancy requires a region with availability zones; confirm UK South zone support and VNet integration prerequisites before committing |
| WAF / CAF implications | Reliability: zone redundancy covers zone failure, not region failure — regional DR is an open decision, owner TBD. Security: managed identity to Azure SQL, no inbound public access once Front Door is in front. CAF: resource name `app-expenseapp-prod-uksouth-001` per the organisation's existing convention |
| Evidence | `get_azure_bestpractices` (web app secure baseline), Microsoft Learn: App Service zone redundancy and SLA pages retrieved for this design |

| Item | Include |
|---|---|
| Decision | Azure SQL Database (General Purpose, zone-redundant), with the mobile-write path landing in a staging table rather than moving the primary store to Cosmos DB |
| Rationale | Financial approval records need strong consistency and relational integrity (approval chains, audit joins); the team's SQL expertise lowers operational risk. Cosmos DB was genuinely in contention for the mobile write pattern, not a strawman: its multi-region write support and flexible schema fit offline-first mobile sync well, and it was rejected on balance, not by default |
| Alternatives | Cosmos DB — closest alternative, rejected for the primary store because eventual-consistency trade-offs are harder to reason about for financial audit data than the write-burst problem it would solve; revisit if mobile write volume or latency requirements grow beyond what a staging-table buffer can absorb. Azure SQL Hyperscale — rejected for now: current concurrency doesn't justify the added cost, revisit if the mobile launch changes the usage profile materially |
| Constraints | Staging-table approach adds a reconciliation job that must be designed and monitored; confirm Azure SQL zone-redundant configuration and max concurrent connection limits support the combined web + mobile-sync load |
| WAF / CAF implications | Reliability: staging table isolates a burst-write failure from the primary approval data. Cost optimisation: avoids running two database platforms, at the cost of extra integration code — an explicit trade-off, not a free win. Performance efficiency: revisit if reconciliation latency becomes user-visible |
| Evidence | `azure-mcp/documentation` search on Azure SQL concurrency limits and Cosmos DB consistency models; Microsoft Learn offline-first mobile sync patterns retrieved for this design |

## Executive Summary excerpt

> Recommend App Service (Premium v3) in UK South with zone redundancy, fronted by Front Door, backed by Azure SQL (zone-redundant). Meets the 99.9% target and UK residency requirement. Primary trade-off: no regional failover in this baseline — add a paired-region warm standby if RTO tightens beyond the current assumption. Status: ready for review pending confirmed usage profile for cost sign-off.

## Cost Model excerpt

> App Service P1v3 (UK South, 1-year reserved): priced live via `azure-pricing` on the date of this design — see References for the retrieved figure. Azure SQL and Front Door: priced live in the same pass. Bandwidth egress and Log Analytics ingestion: estimated from the stated usage assumptions, not live-priced, and flagged as such. Do not reuse a prior conversation's price for the same SKU — re-run the pricing tool.

## What this example is demonstrating

- The first row (App Service vs. Container Apps/AKS) is an easy call — the alternatives are dismissed quickly because they genuinely don't fit. Don't inflate a one-sided decision into false deliberation.
- The second row (Azure SQL vs. Cosmos DB) is a close call — both options are legitimately viable, so the rationale explains *why the trade-off was accepted*, not just which option won. That's the harder, more valuable case to get right, and it's where a decision record earns its place over a one-line recommendation.
- A decision row's depth should track how contested the decision actually is, not be uniform across every row.
- The Executive Summary states a recommendation and its trade-off in a few sentences, not a restated requirements list.
- The cost excerpt explicitly separates what was live-priced from what was estimated, in the same sentence as the estimate — not as a disclaimer added at the end.
