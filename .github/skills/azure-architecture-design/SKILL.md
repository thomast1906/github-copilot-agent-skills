---
name: azure-architecture-design
description: Design Azure solutions and High-Level Designs (HLDs) grounded in current Azure best practices, Microsoft Learn documentation, Well-Architected Framework (WAF), Cloud Adoption Framework (CAF), and live pricing. Use for Azure service selection, solution architecture, modernization, and HLDs; not for a pricing-only lookup or a standalone WAF review.
metadata:
  author: Thomas Thornton
  version: "2.0.0"
  last-updated: "2026-10-08"
---

# Azure Architecture Design

Create a decision-ready Azure architecture: select services to meet the stated requirements, make WAF and CAF implications explicit, and substantiate material decisions with current Microsoft guidance. Pricing is an input to a design decision, not the source of the design.

## Required Azure MCP grounding

Use the Azure MCP tools for every non-trivial design. Discover the exact registered name if the host differs; do not silently replace a tool call with remembered Azure guidance.

1. **Get platform guidance first.** Call `azure-mcp/get_azure_bestpractices` using its currently exposed action and resource parameters. Use it for secure Azure development, deployment, or operations guidance; make separate calls when the tool supports the relevant workload type.
2. **Search documentation before finalising material decisions.** Use `azure-mcp/documentation` search for each selected service and for any feature, limit, SLA, region/zone capability, private DNS, CAF convention, or WAF recommendation that changes the design. Retain the Microsoft Learn links that support the HLD.
3. **Apply WAF guidance to the proposed topology.** Use `azure-mcp/wellarchitectedframework` once the major components are known, with focused intents for pillars that drive a decision or present risk. Do not claim WAF alignment from a generic checklist alone.
4. **Price the selected design.** Invoke `azure-pricing`, which uses `azure-mcp/pricing`, only after the region, service, SKU, and usage assumptions are known. It must retrieve live prices; never copy a price or cost range from a reference file or memory.

Use a narrower path only for a genuinely small request: make at least one best-practices call and documentation search for the deciding constraint. If tools are unavailable, identify which facts could not be verified and label unverified guidance accordingly.

Read [references/azure-mcp-tools.md](references/azure-mcp-tools.md) when deciding whether Bicep schema, Azure Verified Modules, Terraform guidance, Resource Graph, or Azure search would reduce uncertainty.

## Workflow

### 1. Establish decision context

Extract known requirements and ask only for gaps that materially alter the outcome: workload and integrations, data and residency, scale and latency, availability/RPO/RTO, security and compliance, operating model, target regions, budget, and delivery constraints. Label assumptions and distinguish them from confirmed requirements.

### 2. Ground candidates in current guidance

Call `get_azure_bestpractices` before selecting services for applicable platform guidance. Then search Microsoft Learn for the selected services' architecture guidance and any decision-critical behaviour. Search CAF documentation for naming, tagging, management groups, landing-zone governance, or subscription topology when those are in scope. Use the WAF tool for relevant service guidance rather than treating a local checklist as evidence.

For candidate-service prompts and decision questions, read [references/candidate-service-prompts.md](references/candidate-service-prompts.md).

For example, request the tool's general Azure guidance for deployment or operations. Use the tool's discovered parameter schema rather than an invented `intent` argument.

### 3. Select the architecture

Use managed services where they meet requirements; do not make PaaS a rule that overrides control, portability, operational capability, or product needs. For every material component, state:

| Item | Include |
|---|---|
| Decision | Service, tier/SKU when known, region, and topology |
| Rationale | Requirement and current guidance that support it |
| Alternatives | Viable options, why they were not selected, and when to revisit |
| Constraints | Limits, prerequisites, dependencies, or unknowns needing validation |
| WAF / CAF implications | Pillar-specific recommendation(s), applicable CAF convention or control, and any gap |
| Evidence | Best-practices response and Microsoft Learn links used |

Do not invent SKUs, feature support, SLAs, paired-region behaviour, or service limits. Validate them through documentation before reporting them as facts.

### 4. Design WAF and CAF into the solution

For every material component and cross-cutting decision, map the applicable WAF recommendations and CAF conventions to the decision record. Record a recommendation or an explicitly accepted gap; do not imply that every pillar has an equally relevant control for every component. Treat the pillars as design constraints, not a post-design checklist:

- **Reliability:** failure modes, health checks, zones/regions, backup, RPO/RTO, and recovery ownership.
- **Security:** identity, least privilege, secret handling, network exposure, data protection, and threat protection.
- **Cost optimisation:** demand assumptions, scaling boundaries, metering, budgets, and trade-offs with resilience or performance.
- **Operational excellence:** IaC, deployment safety, observability, alerting, runbooks, and ownership.
- **Performance efficiency:** load profile, capacity, caching, asynchronous work, and scale testing.

Apply CAF only at the level the request warrants: resource names and tags for one workload; additionally resource organisation, governance, and landing-zone alignment for enterprise or multi-subscription designs. Make conventions configurable where the organisation has established standards. Cite the current Microsoft Learn or MCP guidance that supports each material WAF/CAF recommendation.

### 5. Price and communicate uncertainty

Once components are stable, invoke `azure-pricing` for each billable SKU in the target region and currency. Get usage assumptions first for metered services. Clearly separate live-priced components from estimates, exclusions, and unpriced dependencies. Compare reservations or savings plans only when the workload's commitment profile supports them.

## Deliverable

For a full HLD, read and use [references/hld-template.md](references/hld-template.md). For concise design advice, return the recommendation, decision table, WAF/CAF implications, cost caveat, and official documentation links rather than generating empty HLD sections.

## Evidence and quality bar

- Cite official Microsoft Learn documentation for each material claim or decision; cite live pricing results separately.
- Explain trade-offs, including where a WAF pillar pulls against cost, simplicity, or delivery speed.
- Do not claim WAF or CAF compliance without naming the guidance used and remaining gaps.
- Do not turn missing requirements into an overly specific architecture. Provide a baseline with labelled assumptions and validation steps.
- Current service behaviour, limits, and pricing must come from MCP guidance and documentation, not the local references.
