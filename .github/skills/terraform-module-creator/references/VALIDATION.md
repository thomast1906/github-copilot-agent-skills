# Validation Reference — Terraform Module Creator

Code quality and static analysis tools for Terraform modules. Run these before committing or tagging a release.

---

## terraform fmt

Formats Terraform files to the canonical HCL style. Always run before committing.

```bash
# Format all files in the module recursively
terraform fmt -recursive .

# Check only (non-zero exit if formatting needed — useful in CI)
terraform fmt -check -recursive .
```

**What it catches:** inconsistent indentation, misaligned equals signs, unnecessary whitespace.

**What it does not catch:** logic errors, invalid arguments, deprecated resources.

---

## terraform validate

Validates that the configuration is syntactically correct and internally consistent. Requires `terraform init` to have been run first.

```bash
terraform init -backend=false
terraform validate
```

`-backend=false` skips backend initialisation, which is useful in CI where no remote state is configured.

**What it catches:** missing required arguments, invalid references, type mismatches, undeclared variables.

**What it does not catch:** provider-specific argument validity (e.g., invalid SKU values), deprecated arguments — that is tflint's job.

---

## tflint

[tflint](https://github.com/terraform-linters/tflint) is a static analysis tool that catches provider-specific issues that `terraform validate` misses.

**Install:**
```bash
# macOS
brew install tflint

# Linux
curl -s https://raw.githubusercontent.com/terraform-linters/tflint/master/install_linux.sh | bash

# Via go
go install github.com/terraform-linters/tflint@latest
```

**Run:**
```bash
tflint --init   # fetch configured plugins
tflint
```

### .tflint.hcl configuration

Always generate a `.tflint.hcl` file in the module root.

```hcl
plugin "azurerm" {
  enabled = true
  version = "0.27.0"  # pin to latest stable
  source  = "github.com/terraform-linters/tflint-ruleset-azurerm"
}

config {
  call_module_type = "local"
}

rule "terraform_required_version" {
  enabled = true
}

rule "terraform_required_providers" {
  enabled = true
}

rule "terraform_naming_convention" {
  enabled = true
}

rule "terraform_documented_variables" {
  enabled = true
}

rule "terraform_documented_outputs" {
  enabled = true
}

rule "terraform_typed_variables" {
  enabled = true
}
```

**What tflint catches that validate misses:**
- Deprecated `azurerm` resource arguments (e.g., arguments removed in provider upgrades)
- Invalid SKU / tier values for Azure resources
- Missing variable descriptions
- Variables without explicit types
- Naming convention violations
- Unused declarations

### Update the tflint azurerm plugin version

Check the [tflint-ruleset-azurerm releases](https://github.com/terraform-linters/tflint-ruleset-azurerm/releases) for the latest version before generating `.tflint.hcl`.

---

## pre-commit Integration

If the team uses [pre-commit](https://pre-commit.com/), add these hooks to `.pre-commit-config.yaml` to run all checks automatically on commit:

```yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.96.2   # pin to latest stable
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
        args:
          - --args=-json
          - --hook-config=--retry-once-with-cleanup=true
      - id: terraform_tflint
        args:
          - --args=--config=__GIT_WORKING_DIR__/.tflint.hcl

  - repo: https://github.com/terraform-docs/terraform-docs
    rev: "v0.19.0"
    hooks:
      - id: terraform-docs-go
        args: ["--config", ".terraform-docs.yml", "."]
```

This runs fmt, validate, tflint, and terraform-docs on every commit with no manual steps.

---

## CI Pipeline

For modules in a CI pipeline (GitHub Actions, Azure DevOps), a minimal validation job:

```yaml
# GitHub Actions example
name: Validate Terraform Module

on:
  pull_request:
    paths:
      - 'modules/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "~1.9"

      - name: terraform fmt check
        run: terraform fmt -check -recursive .

      - name: terraform init
        run: terraform init -backend=false
        working-directory: modules/your-module

      - name: terraform validate
        run: terraform validate
        working-directory: modules/your-module

      - name: Install tflint
        run: |
          curl -s https://raw.githubusercontent.com/terraform-linters/tflint/master/install_linux.sh | bash

      - name: tflint init
        run: tflint --init
        working-directory: modules/your-module

      - name: tflint
        run: tflint
        working-directory: modules/your-module
```

---

## Summary: validation order

Run in this order — each layer catches different things:

| Tool | Catches | Requires |
|------|---------|---------|
| `terraform fmt -check` | Formatting issues | Nothing |
| `terraform validate` | Syntax and reference errors | `terraform init` |
| `tflint` | Provider-specific errors, deprecated args, naming | `tflint --init` |
| `terraform-docs` | README drift | Nothing |
