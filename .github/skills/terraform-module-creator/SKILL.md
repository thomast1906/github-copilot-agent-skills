---
name: terraform-module-creator
description: Design and create Terraform modules from real infrastructure requirements. Use when asked to create a Terraform module, build a module from a requirement, turn repeated Terraform into a module, design module inputs and outputs, review whether a Terraform pattern should become a module, refactor existing Terraform into a reusable module, or assess whether a module is over-abstracted. Covers Azure-focused modules with KISS/DRY principles, module boundary definition, interface design, and practical file structure generation. Do NOT use for general Terraform coding with no module boundary, provider version upgrades (use terraform-provider-upgrade skill), or non-Terraform IaC.
---

# Terraform Module Creator

## Purpose

Use this skill to help design and create Terraform modules from real infrastructure requirements.

This skill is intended to do more than generate Terraform files. It should help decide whether a module is justified in the first place, define a clear module responsibility, shape a clean interface, and avoid over-engineering.

The goal is to produce Terraform modules that are understandable, maintainable, and genuinely useful in practice.

## Prerequisites

The following tools must be installed locally before using this skill. The skill references them during generation and validation steps.

| Tool | Purpose | Install |
|------|---------|---------|
| [Terraform](https://developer.hashicorp.com/terraform/install) | Core IaC tool — `init`, `validate`, `fmt` | `brew install hashicorp/tap/terraform` |
| [terraform-docs](https://terraform-docs.io/user-guide/installation/) | Generates README inputs/outputs from module source | `brew install terraform-docs` |
| [tflint](https://github.com/terraform-linters/tflint#installation) | Static analysis — catches deprecated args, provider-specific issues | `brew install tflint` |
| [tflint-ruleset-azurerm](https://github.com/terraform-linters/tflint-ruleset-azurerm) | Azure-specific tflint rules | configured via `.tflint.hcl` (see [VALIDATION.md](references/VALIDATION.md)) |

**Minimum versions:** Terraform ≥ 1.2 (required for `lifecycle` preconditions/postconditions). terraform-docs ≥ 0.16. tflint ≥ 0.50.

If any tool is missing, the skill will flag this and suggest the install command before running validation steps.

## Required MCP Tools

This skill makes active use of the HashiCorp Terraform Registry MCP and the Azure MCP Server. Use the tools below at the indicated stages of the workflow. Full parameter reference and example call sequences are in [references/MCP-TOOLS.md](references/MCP-TOOLS.md).

| Tool | Stage | Purpose |
|------|-------|---------|
| `azure-azureterraformbestpractices` | Step 1 — Understand the ask | Get Azure Terraform best practices before starting design |
| `azure-get_azure_bestpractices` | Step 1 — Understand the ask | Get platform-level best practices for the specific Azure service |
| `azure-documentation` | Step 1 — Understand the ask | Look up CAF naming standards, DNS zone names, service feature behaviour |
| `azure-wellarchitectedframework` | Step 1 / Step 6 | Get WAF pillar recommendations to inform secure, reliable defaults |
| `mcp_terraform_search_modules` | Step 2 — Decide module type | Check if an Azure Verified Module or registry module already exists |
| `mcp_terraform_get_module_details` | Step 2 — Decide module type | Review an existing module's inputs/outputs to assess fit |
| `mcp_terraform_get_provider_capabilities` | Step 3 — Define boundary | Discover what azurerm resources exist for the service area |
| `mcp_terraform_search_providers` | Step 4 — Design interface | Find provider resource documentation by service slug |
| `mcp_terraform_get_provider_details` | Step 4 — Design interface | Get full argument reference and attribute reference for a resource |
| `mcp_terraform_get_latest_provider_version` | Step 6 — Generate module | Get the current latest azurerm version for versions.tf |

**Important:** Before invoking any Azure MCP tool, run a discovery call with `learn=true` or `tool_search_tool_regex` to confirm the exact tool name. Do not hardcode names that may change.

## When to Use

- a user wants to create a new Terraform module from a requirement or scenario
- a repeated Terraform pattern may need to become a shared module
- a team wants help shaping module inputs, outputs, and scope
- a platform team wants to define a reusable Terraform pattern without unnecessary abstraction
- reviewing whether plain Terraform resources would be better than introducing a new module
- creating Azure-focused Terraform modules that need to align with platform standards and operational expectations

## Core principles

Always optimise for the following:

- **KISS** — Keep the module easy to understand, easy to consume, and easy to support.
- **DRY with judgement** — Reduce meaningful duplication, but do not chase abstraction for its own sake.
- **Clear responsibility** — A module should solve one coherent problem well.
- **Practical reuse** — Build modules for real repeated demand, not hypothetical future scenarios.
- **Readable interfaces** — Variables, outputs, defaults, and naming should be obvious and predictable.
- **Operational supportability** — A team should be able to understand what the module does and how to use it without fighting through unnecessary complexity.
- **Safe and sensible defaults** — Be opinionated where it reduces toil and inconsistency, but do not hide critical behaviour.

## Approach

Follow this process for every request.

### 1. Understand the ask

Call `azure-azureterraformbestpractices` and `azure-get_azure_bestpractices` for the target Azure service before starting design. Call `azure-documentation` for CAF naming conventions, private endpoint DNS zone names, or any service feature behaviour that needs current guidance. Call `azure-wellarchitectedframework` to understand which WAF pillar recommendations should inform the module's default values. This grounds decisions in current Azure platform guidance rather than assumptions.

Identify:

- what is being deployed
- what problem the module is solving
- who will consume the module
- whether this is platform-level reuse or a local implementation detail
- whether the requirement is stable enough to justify a shared module

Where useful, restate the module intent in one sentence before generating anything.

Example:
> This module is intended to provision a standard Azure Storage Account pattern with consistent naming, tagging, diagnostics, and access configuration for shared platform use.

### 2. Decide the module type

**Check the Terraform Registry for reference.** Call `mcp_terraform_search_modules` to see what existing modules look like for the resource. Use this to understand common interface patterns and what other teams have found necessary — not to replace the custom module. AVM and registry modules are often over-abstracted and do not align with the KISS principle this skill applies. Review them for ideas, not as a recommendation to adopt.

If a candidate is found, call `mcp_terraform_get_module_details` to review its interface. Use this to identify what arguments matter in practice and what complexity to avoid.

Work out whether the module is:

- a **building block module** — a focused reusable unit for a specific infrastructure component
- a **composition module** — a higher-level module that combines several related resources into a usable pattern

Prefer building block modules unless a composition module clearly maps to a repeated platform pattern. Do not create composition modules that bundle unrelated concerns together.

### 3. Define the module boundary

State clearly:

- what the module owns
- what it expects from consumers
- what should remain outside the module
- what dependencies should be passed in rather than created internally
- what operational assumptions the module is making

A good module boundary should be easy to explain in a few lines.

### 4. Design the interface

Use `mcp_terraform_search_providers` to find the resource documentation by service slug, then call `mcp_terraform_get_provider_details` with the returned `provider_doc_id` to get the full argument reference. Use this to understand all available arguments before deciding which to expose as variables. See [references/MCP-TOOLS.md](references/MCP-TOOLS.md) for common service slug values.

Design variables and outputs with discipline.

**Variables**
- include only what consumers genuinely need to set
- prefer clear, explicit names
- group related inputs logically
- use defaults where the behaviour is predictable and safe
- avoid exposing every possible provider option
- avoid optional inputs that massively change module behaviour
- avoid large sets of loosely related switches
- add `validation {}` blocks to enum-style variables (SKU, tier, kind) and name format constraints — catch bad inputs at plan time with a clear error message, not a cryptic provider error

**Outputs**
- return only values that consumers are likely to use
- keep outputs meaningful and predictable
- avoid outputting everything just because it is available
- mark `sensitive = true` on any output containing a secret: connection strings, access keys, passwords, SAS tokens
- prefer outputting `principal_id` (managed identity) over connection strings — guide consumers toward keyless authentication

**Locals**
- use locals to improve readability and consistency
- do not hide important logic unnecessarily

### 5. Recommend a file structure

Start simple. A typical module structure:

```
module/
├── main.tf
├── variables.tf
├── outputs.tf
├── versions.tf
├── .terraform-docs.yml
├── README.md
└── examples/
    └── basic/
        ├── main.tf
        ├── variables.tf
        ├── outputs.tf
        ├── versions.tf
        └── README.md
```

Add `locals.tf` if it improves clarity. Only add more files if there is a clear readability benefit. Do not create file sprawl for the sake of neatness.

Always create an `examples/basic/` folder alongside the module. Each example is a standalone, independently runnable Terraform root module — it needs its own `main.tf` (the module call), `variables.tf`, `outputs.tf`, `versions.tf`, and `README.md`. The `main.tf` should demonstrate minimum viable usage with hardcoded values; keep `variables.tf` minimal and only expose what a caller genuinely needs to parameterise (e.g., resource group name, location). For modules with distinct usage patterns (e.g., with and without private endpoint), add a second subfolder such as `examples/private-endpoint/` with the same full file set.

Always include `.terraform-docs.yml` — the README inputs and outputs table is generated by `terraform-docs`, not written by hand. The README contains a static description and usage example written by the author, with `<!-- BEGIN_TF_DOCS -->` / `<!-- END_TF_DOCS -->` markers where terraform-docs injects the generated content.

### 6. Generate the module

Before generating `versions.tf`, call `mcp_terraform_get_latest_provider_version(namespace="hashicorp", name="azurerm")` to get the current latest version and use it as the minimum constraint.

For modules with dependent optional variables (e.g., `private_endpoint.enabled = true` requires `subnet_id`), add `lifecycle { precondition {} }` blocks on the resource to surface misconfigurations clearly before any resource is created. See [MODULE-PATTERNS.md](references/MODULE-PATTERNS.md#lifecycle-preconditions-and-postconditions) for the pattern.

When generating code:

- prefer readable Terraform over clever Terraform
- keep resource declarations easy to follow
- use naming and tagging patterns consistently
- reflect platform standards where relevant
- include diagnostics, identity, or governance-related configuration where it is part of the intended pattern
- avoid deep conditional complexity unless it is truly necessary

Always generate the following alongside the Terraform files:

- **`.terraform-docs.yml`** — terraform-docs configuration (see [MODULE-PATTERNS.md](references/MODULE-PATTERNS.md#terraform-docs-configuration))
- **`README.md`** — static purpose description and usage example with `<!-- BEGIN_TF_DOCS -->` / `<!-- END_TF_DOCS -->` markers; do not hand-write the inputs/outputs table — that is generated by running `terraform-docs .`
- **`examples/basic/main.tf`** — the module call with sensible defaults; use hardcoded values appropriate for an example, not variables
- **`examples/basic/variables.tf`** — any inputs the example exposes to the caller (e.g., subscription ID, resource group name); keep this minimal
- **`examples/basic/outputs.tf`** — relevant outputs from the module call (e.g., resource ID, connection string reference)
- **`examples/basic/versions.tf`** — provider `required_providers` block pinned to the same constraint as the module itself; the example is a real Terraform root and must be independently runnable
- **`examples/basic/README.md`** — one-sentence description of what this example demonstrates

Add further subfolders (e.g., `examples/private-endpoint/`) for distinct usage patterns, each with the same full file set.

Tell the consumer to run `terraform-docs .` after any variable or output changes to regenerate the inputs/outputs table in the README. If a pre-commit hook is in use, provide the hook config from MODULE-PATTERNS.md.

### 7. Review the result critically

Before finalising, check:

- does this module have a clear responsibility?
- is it trying to solve too many scenarios?
- are there too many inputs?
- are the defaults sensible?
- is the abstraction justified?
- would a team understand this quickly?
- does it reduce real duplication and inconsistency?
- will this be easy to maintain in six months?

If the module feels hard to explain, it is probably doing too much.

**Before handing off, run:**

```bash
terraform fmt -check -recursive .   # formatting
terraform init -backend=false && terraform validate   # syntax and references
tflint --init && tflint             # provider-specific issues, deprecated args, naming
terraform-docs .                    # README in sync with variables and outputs
```

Before running these commands, verify each tool is available (`terraform -version`, `terraform-docs --version`, `tflint --version`). If a tool is missing, output the install command from the Prerequisites section and stop — do not silently skip the validation step.

See [references/VALIDATION.md](references/VALIDATION.md) for full tool setup, `.tflint.hcl` config, and CI pipeline guidance.

## Decision framework: should this be a module?

Before creating a module, stop and assess whether a module is actually the right answer.

Ask:

- Is this a real repeated pattern?
- Does a module reduce cognitive load for other teams?
- Is there a clear boundary and responsibility?
- Does the module add value beyond wrapping one resource?
- Would direct Terraform resources be simpler and clearer?
- Is this being abstracted for proven need or imagined reuse?

If a module is not justified, say so clearly. Do not create modules just because something appears more than once. A module should exist because it improves clarity, consistency, and supportability.

## Output expectations

Depending on the request, produce one or more of the following:

- a recommendation on whether a module should exist
- a proposed module scope and boundary
- a suggested input/output contract
- a recommended file structure
- starter Terraform implementation
- example module usage
- a short README
- notes on trade-offs and design choices
- warnings about over-engineering or weak abstraction

## Review mode

If the user already has Terraform or a draft module, review it by asking:

- should this be a module at all?
- is the module boundary clear?
- are the inputs sensible?
- are outputs useful and limited?
- is the level of abstraction justified?
- what would simplify this?
- what will become painful to operate later?

Provide direct, practical feedback.

## Refactor mode

If the user has repeated Terraform code and wants to extract a module:

1. identify the repeated pattern
2. isolate the stable reusable responsibility
3. propose a minimal module contract
4. highlight what should remain outside the module
5. suggest migration steps carefully — add `moved {}` blocks for any renamed or restructured resources to prevent destructive plan changes for existing consumers (see [MODULE-PATTERNS.md](references/MODULE-PATTERNS.md#moved-blocks))
6. avoid dragging one-off concerns into the new shared interface

## Azure-specific considerations

When working on Azure Terraform modules, follow the platform standards in [references/AZURE-STANDARDS.md](references/AZURE-STANDARDS.md). Key areas:

- naming consistency (CAF pattern)
- required tags
- RBAC scope
- identity configuration (prefer managed identity)
- diagnostics and observability
- networking assumptions (do not create VNets or DNS zones inside the module)
- environment separation
- alignment with platform guardrails
- whether Azure Verified Modules or an existing shared module should be preferred

Do not assume a new custom module is always the best answer.

## Strong opinions

Apply these consistently:

- A module should reduce repeated cognitive load, not just repeated lines.
- DRY matters, but not at the expense of readability.
- KISS matters more than theoretical flexibility.
- Shared modules should solve real problems teams actually have.
- A module with too many variables is often a design smell.
- Wrapping a single resource is not automatically good modular design.
- Optionality should not turn a module into a framework.
- Prefer simple composition over deep abstraction.
- If a module becomes difficult to explain, narrow its scope.
- Just because Terraform can model a highly dynamic interface does not mean it should.

## Guardrails

Do not:

- create a module when plain Terraform would be simpler
- create modules for one-off scenarios with no realistic reuse
- expose every resource argument as a variable
- combine unrelated responsibilities into one module
- build speculative abstraction for future possibilities
- generate kitchen-sink modules with many feature flags
- hide important behaviour behind opaque locals or conditions
- confuse platform standards with inflexible design

## Response style

- be direct and practical
- explain the reasoning behind module boundaries
- call out weak abstraction clearly
- keep the design grounded in real delivery and support needs
- prefer simple and opinionated recommendations over vague completeness
- do not praise complexity
- do not present over-engineering as sophistication

## Example prompts this skill should handle well

- Create a Terraform module for an Azure Storage Account with consistent naming, tags, diagnostics, and private endpoint support.
- Should this repeated Azure Key Vault pattern become a module, or should we keep it inline?
- Design a Terraform module interface for deploying an Azure App Service plan and web app pair.
- Review this Terraform module and tell me if it is over-abstracted.
- Refactor this repeated Terraform pattern into a reusable module without turning it into a framework.

## References

Supporting reference material for this skill:

- [MCP-TOOLS.md](references/MCP-TOOLS.md) — HashiCorp Terraform Registry and Azure MCP tool reference: when to use each tool, example calls, and a full workflow sequence
- [MODULE-PATTERNS.md](references/MODULE-PATTERNS.md) — Common Terraform module patterns for Azure: file structure, variables, outputs, validation blocks, preconditions, sensitive outputs, managed identity, diagnostics, private endpoints, `moved` blocks, tagging
- [AZURE-STANDARDS.md](references/AZURE-STANDARDS.md) — Azure naming conventions (CAF), required tags, security defaults, networking assumptions, Azure Verified Modules guidance
- [VERSIONING.md](references/VERSIONING.md) — SemVer guidance, git tagging, module source refs, GitHub releases, private registry, CHANGELOG
- [VALIDATION.md](references/VALIDATION.md) — terraform fmt, terraform validate, tflint (with `.tflint.hcl` config), pre-commit hooks, CI pipeline example
