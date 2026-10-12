# Azure Architecture Design: Candidate-Service Prompts

Use this reference only to form candidate options and questions. It is not a source of current capabilities, limits, availability, or prices: validate those through `azure-mcp/get_azure_bestpractices` and `azure-mcp/documentation`.

## Compute

| Workload signal | Candidates to evaluate | Deciding questions |
|---|---|---|
| Managed web app or API | App Service, Container Apps | Runtime/container requirement, VNet access, scale pattern, background jobs |
| Event-driven processing | Functions, Container Apps jobs, Logic Apps | Execution duration, state, triggers, throughput, integration needs |
| Containerised distributed system | Container Apps, AKS | Need for Kubernetes APIs/add-ons, platform operations capability, portability |
| OS or specialised software control | Virtual Machines, VM Scale Sets | OS drivers, legacy dependencies, patching and HA responsibility |

## Data and integration

| Requirement | Candidates to evaluate | Deciding questions |
|---|---|---|
| Transactional relational data | Azure SQL Database, Azure Database for PostgreSQL/MySQL, SQL Managed Instance | Engine compatibility, migration scope, HA/DR, data size, connection model |
| Globally distributed or flexible-schema data | Azure Cosmos DB, storage services | Consistency, latency, partitioning, throughput, data model |
| Object/file/analytics storage | Blob Storage, Azure Files, Data Lake Storage | Protocol, retention, lifecycle, access pattern, analytics requirement |
| Commands, events, streams, workflows | Service Bus, Event Grid, Event Hubs, Logic Apps, Durable Functions | Delivery guarantees, ordering, fan-out, throughput, orchestration |

## Questions requiring documentation validation

- Is the selected SKU, region, zone option, private connectivity method, and DR capability supported for this service?
- What limits, quotas, networking/DNS prerequisites, and dependencies affect the design?
- Which reference architecture or WAF guidance supports the selected pattern?
- Which CAF naming, tagging, resource-organisation, and governance standards apply?
- What usage model and meters must be known before a cost estimate is meaningful?
