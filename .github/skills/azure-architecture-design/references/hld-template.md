# High-Level Design Template

Use this template for a full HLD. Scale sections to the request; do not add empty sections to concise design advice.

```markdown
# High-Level Design: <workload name>

## 1. Executive Summary
Recommendation, business outcome, primary trade-offs, target region(s), and decision status.

## 2. Requirements and Assumptions
Functional and non-functional requirements; confirmed constraints; assumptions requiring validation.

## 3. Architecture Overview
Pattern, diagram or diagram description, component/data flows, trust boundaries, and topology.

## 4. Architecture Decisions
For every material component and cross-cutting decision, record the applicable WAF recommendation(s), CAF convention/control, and an evidence link. If a pillar or CAF control is not applicable, state why; if a recommendation is deferred, record the resulting risk and owner.

| Decision | Chosen option | Alternatives considered | WAF / CAF implications | Rationale | Evidence | Open validation |
|---|---|---|---|---|---|---|

## 5. Component Design
For every material component: purpose, service/SKU, region/topology, dependencies, configuration choices, and operational owner.

## 6. Network, Identity, and Security Design
Ingress/egress, private connectivity and DNS, identity/RBAC, secrets, encryption, logging, and threat protections.

## 7. Data Protection and Resilience
Data classification, backup/retention, RPO/RTO, failure scenarios, regional strategy, and recovery process.

## 8. WAF Assessment
Consolidate the per-decision mapping into strengths, gaps, evidence, and prioritised actions across Reliability, Security, Cost Optimisation, Operational Excellence, and Performance Efficiency. Do not replace the decision mapping with a generic checklist.

## 9. CAF Alignment
Consolidate the per-decision mapping for naming, tagging, resource organisation, governance, policy, and landing-zone decisions that are in scope. Identify any existing organisational standard that overrides the baseline guidance.

## 10. Operations and Deployment
IaC approach, CI/CD, observability, SLOs/alerts, runbooks, change/rollback process, and ownership.

## 11. Cost Model
Live pricing date/source, regions, usage assumptions, monthly and annual costs, exclusions, and optimisation options.

## 12. Risks, Open Decisions, and Next Steps
Risk, impact, mitigation, owner, validation activity, and phased implementation actions.

## References
Microsoft Learn documentation and Azure MCP guidance used for material decisions.
```
