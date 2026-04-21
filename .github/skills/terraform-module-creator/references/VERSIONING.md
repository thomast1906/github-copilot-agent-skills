# Module Versioning Reference — Terraform Module Creator

Guidance for versioning and releasing shared Terraform modules. This applies when the module will be consumed by other teams or published to a shared registry.

---

## Use SemVer

All modules should follow [Semantic Versioning](https://semver.org/): `vMAJOR.MINOR.PATCH`

| Part | When to bump | Examples |
|------|-------------|---------|
| `MAJOR` | Breaking change — callers must update their code | Removing or renaming a variable, removing an output, changing a default that breaks existing deployments, restructuring the module boundary |
| `MINOR` | Backwards-compatible new capability | Adding a new optional variable with a safe default, adding a new output, adding an optional resource (e.g., private endpoint support) |
| `PATCH` | Bug fix with no interface change | Fixing a misconfigured default, correcting a resource argument that had no consumer-visible effect, updating documentation |

**Start at `v0.1.0`** while the module is being shaped and not yet stable. Move to `v1.0.0` when the interface is considered stable and the module is in production use.

---

## Git Tags

Tag releases directly in Git. Use the `v` prefix:

```bash
git tag -a v1.0.0 -m "Initial stable release"
git push origin v1.0.0
```

Tags must be **annotated** (`-a`), not lightweight, when used as release markers.

**Never tag `main` or a branch name as a version.** Consumers must always pin to a tag, not a branch. Branches move; tags do not.

---

## Module Source Reference

Consumers should always pin to a specific tag in their source reference:

```hcl
module "storage" {
  source = "git::https://github.com/your-org/terraform-modules.git//modules/storage-account?ref=v1.2.0"
}
```

**Do not use:**
```hcl
# Bad — HEAD moves, plan results become unpredictable
source = "git::https://github.com/your-org/terraform-modules.git//modules/storage-account"

# Bad — branch reference is mutable
source = "git::https://github.com/your-org/terraform-modules.git//modules/storage-account?ref=main"
```

---

## GitHub Releases

When using GitHub as the module host, create a GitHub Release for each version tag.

A minimal release note should include:

- **What changed** — brief description of the change
- **Breaking changes** — explicit list of what callers must update (if MAJOR bump)
- **Migration steps** — how to move from the previous version (if MAJOR bump)

Example release note for a breaking change:

```
## v2.0.0

### Breaking changes

- `storage_tier` variable renamed to `account_tier` — update all callers
- `primary_access_key` output removed — use managed identity instead

### Migration

Replace `storage_tier` with `account_tier` in all module blocks.
Remove any references to the `primary_access_key` output.
```

---

## Breaking Changes and `moved` Blocks

When refactoring module internals (renaming resources, changing resource types), use `moved` blocks to prevent state disruption for existing consumers. See [MODULE-PATTERNS.md](MODULE-PATTERNS.md#moved-blocks) for the pattern.

If a `moved` block cannot cover the change (e.g., the resource type itself changes), this is a breaking change and requires a MAJOR version bump.

---

## Private Terraform Registry

For organisations using a private Terraform registry (Terraform Cloud, Terraform Enterprise, or a self-hosted registry):

**Module naming convention:**

```
<registry-hostname>/<namespace>/<module-name>/<provider>
```

Example:
```
app.terraform.io/your-org/storage-account/azurerm
```

**Source reference:**
```hcl
module "storage" {
  source  = "app.terraform.io/your-org/storage-account/azurerm"
  version = "~> 1.2"
}
```

**Version constraint guidance for consumers:**

| Constraint | Meaning | Use when |
|-----------|---------|---------|
| `= 1.2.0` | Exact pin | Maximum stability, no automatic updates |
| `~> 1.2.0` | Patch upgrades only | Safe default for most production use |
| `~> 1.2` | Minor + patch upgrades | Acceptable when MINOR changes are consistently backwards-compatible |
| `>= 1.0, < 2.0` | Any non-breaking version | Common in platform libraries |

**Avoid `>= 1.0` without an upper bound.** It allows MAJOR version upgrades silently.

---

## Changelog

Keep a `CHANGELOG.md` in the module repository root.

Use this simple format:

```markdown
# Changelog

## [2.0.0] - 2025-04-01
### Breaking
- Renamed `storage_tier` to `account_tier`
- Removed `primary_access_key` output

## [1.2.0] - 2025-02-14
### Added
- Optional private endpoint support via `private_endpoint` variable

## [1.1.0] - 2025-01-10
### Added
- Diagnostic settings support via `diagnostic_settings` variable

## [1.0.0] - 2024-12-01
Initial stable release
```

---

## Summary: Release checklist

Before tagging a new version:

- [ ] `terraform fmt -recursive .` passes
- [ ] `terraform validate` passes
- [ ] terraform-docs has been run and README is up to date
- [ ] CHANGELOG.md is updated
- [ ] Breaking changes documented with migration steps
- [ ] `moved` blocks added where resources were renamed/restructured
- [ ] Tag created (`git tag -a vX.Y.Z -m "..."`)
- [ ] GitHub Release created with release notes
