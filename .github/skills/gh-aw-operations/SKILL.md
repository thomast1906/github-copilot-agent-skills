---
name: gh-aw-operations
description: Comprehensive skills for creating, compiling, debugging, and managing GitHub Agentic Workflows (gh-aw) with best practices and common patterns
metadata:
  version: 1.0.0
  category: automation
  tags: [github-agentic-workflows, gh-aw, automation, ci-cd, ai-workflows]
---

# GitHub Agentic Workflows Operations Skill

This skill provides expertise in creating, managing, and troubleshooting GitHub Agentic Workflows (gh-aw framework).

## When to Use

- Creating new GitHub Agentic Workflows from scratch
- Configuring frontmatter fields (triggers, permissions, tools, safe-outputs, MCP servers)
- Debugging compilation errors or runtime failures in gh-aw workflows
- Adding safe-outputs or network allowlists to existing workflows
- Importing reusable agents and skills from external repositories
- Testing and deploying workflows to GitHub Actions

## Skill 1: Frontmatter Configuration

### Description
Configure workflow frontmatter with all required and optional fields following gh-aw specifications.

### Implementation Pattern

```yaml
---
# ===== REQUIRED FIELDS =====
on:
  workflow_dispatch:
    inputs:
      parameter_name:
        description: 'Clear description of parameter'
        required: false
        type: string|boolean|choice|number
        default: "default_value"  # Boolean: "true"/"false" as strings
  schedule:
    - cron: '0 9 * * 1'  # Monday 9 AM UTC
  issues:
    types: [opened, labeled]
  pull_request:
    types: [opened, synchronize]

engine: copilot  # GitHub Copilot as AI engine

permissions:
  contents: read      # NEVER use write — strict mode blocks it
  pull-requests: read # All writes go through safe-outputs
  issues: read

# ===== TOOLS CONFIGURATION =====
tools:
  edit:              # bare key — enables file read AND edit
  bash:              # bare key — default safe commands
  github:
    toolsets: [pull_requests]  # Only include toolsets your workflow needs

# ===== MCP SERVERS (if needed) =====
mcp-servers:
  terraform:
    container: "hashicorp/terraform-mcp-server:0.3.3"
    env:
      TF_LOG: "INFO"
    allowed: ["*"]

# ===== SAFE OUTPUTS =====
safe-outputs:
  create-pull-request:
    title-prefix: "[automated] "
    labels: [automation]
    draft: true
    reviewers: [copilot]
    expires: 14
    fallback-as-issue: true
  create-issue:
    title-prefix: "[bot] "
    labels: [automation]
    expires: 7
  update-issue: null
  add-comment: null

# ===== NETWORK ACCESS =====
network:
  allowed:
    - defaults
    - registry.terraform.io
    - releases.hashicorp.com
    - api.github.com

# ===== IMPORTS (if using reusable agents/skills) =====
imports:
  - owner/repo/.github/agents/agent-name.agent.md@main
  - owner/repo/.github/skills/skill-name/SKILL.md@main
---
```

### Key Rules
- **`edit:` is a bare key** (no value) — enables both reading and writing files. `edit: null` and `edit: true` both fail compilation.
- **`read:` is not a valid tool** — file reading is provided by `edit:`.
- **`bash:` is a bare key** (no value) for default safe commands, or `bash: ["cmd"]` for specific commands.
- **`contents: write` / `pull-requests: write` / `issues: write` are blocked by strict mode** — use `safe-outputs:` for all write operations instead.
- **`pull_request:` trigger requires `types:`** — bare `pull_request:` fails compilation.
- **`workflow_dispatch:` is a bare key** — `workflow_dispatch: null` fails compilation.
- **Toolsets and permissions must align** — `toolsets: [default]` includes the `issues` toolset which requires `issues: read`; only declare the toolsets you actually need.
- Boolean defaults must be strings: `default: "true"` not `default: true`
- Safe-output fields use hyphens: `create-pull-request` not `create_pull_request`
- Imports use `owner/repo/path@ref` format, not raw GitHub URLs
- Safe-outputs can be bare key (default config) or object (custom config)

---

## Skill 2: Safe-Outputs Configuration

### Description
Configure safe-outputs for GitHub operations (PRs, issues, comments) with proper validation and best practices.

### Common Safe-Output Patterns

#### Pattern: Pull Request Creation
```yaml
safe-outputs:
  create-pull-request:
    title-prefix: "[type] "
    labels: [automation, bot-generated]
    draft: true
    reviewers: [copilot]
    expires: 14  # Auto-close after 14 days
    fallback-as-issue: true  # Create issue if PR fails
    base-branch: main  # Target branch
```

**When to use:**
- Automated code changes
- Dependency upgrades
- Code generation
- Refactoring

#### Pattern: Issue Creation
```yaml
safe-outputs:
  create-issue:
    title-prefix: "[report] "
    labels: [automation, needs-review]
    assignees: [copilot]
    expires: 7
    group: true  # Group multiple issues as sub-issues
    close-older-issues: true  # Close previous issues from same workflow
```

**When to use:**
- Reporting findings
- Tracking tasks
- Alerting on issues
- Documentation requests

#### Pattern: Issue/PR Comments
```yaml
safe-outputs:
  add-comment:
    target: "triggering"  # Comment on triggering issue/PR
    max: 3
    hide-older-comments: true  # Hide previous comments from same workflow
```

**When to use:**
- Status updates
- Analysis results
- Bot responses
- Progress reporting

#### Pattern: PR Reviews
```yaml
safe-outputs:
  create-pull-request-review-comment:
    max: 10
    side: "RIGHT"
    footer: "if-body"  # Only show footer when review has body
  submit-pull-request-review:
    max: 1
    footer: false
```

**When to use:**
- Code review automation
- Inline suggestions
- Security analysis
- Style checking

#### Pattern: Label Management
```yaml
safe-outputs:
  add-labels:
    allowed: [bug, enhancement, documentation]
    max: 3
  remove-labels:
    allowed: [needs-triage, stale]
    max: 3
```

**When to use:**
- Workflow status tracking
- Issue classification
- Automation state management

### Available Safe-Output Types
- `create-pull-request` - Create PRs with code changes
- `create-issue` - Create issues
- `update-issue` - Update issue title/body/status
- `close-issue` - Close issues
- `create-discussion` - Create discussions
- `update-discussion` - Update discussions
- `close-discussion` - Close discussions
- `add-comment` - Add comments to issues/PRs/discussions
- `hide-comment` - Hide comments
- `add-labels` - Add labels
- `remove-labels` - Remove labels
- `add-reviewer` - Add PR reviewers
- `create-pull-request-review-comment` - Add PR review comments
- `submit-pull-request-review` - Submit PR review
- `update-pull-request` - Update PR title/body
- `dispatch-workflow` - Trigger other workflows
- `create-project`, `update-project` - Manage GitHub Projects
- `upload-asset` - Upload files to orphaned branch

---

## Skill 3: MCP Server Integration

### Description
Configure and use Model Context Protocol (MCP) servers for specialized tool access.

### Common MCP Server Configurations

#### Terraform MCP Server
```yaml
mcp-servers:
  terraform:
    container: "hashicorp/terraform-mcp-server:0.3.3"
    env:
      TF_LOG: "INFO"
    allowed: ["*"]  # or specific tools
```

**Available operations:**
- Read Terraform configurations
- Analyze provider versions
- Detect breaking changes
- Generate upgrade recommendations

#### Azure MCP Server
```yaml
mcp-servers:
  azure:
    container: "mcr.microsoft.com/azure-sdk/azure-mcp:latest"
    env:
      AZURE_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

**Available operations:**
- Azure resource queries
- Best practices validation
- Documentation lookup
- Terraform Azure integration

#### Custom MCP Server
```yaml
mcp-servers:
  custom:
    container: "your-org/your-mcp-server:v1.0.0"
    env:
      API_KEY: ${{ secrets.API_KEY }}
    allowed: ["specific_tool1", "specific_tool2"]
```

### Network Configuration for MCP Servers
```yaml
network:
  allowed:
    - defaults  # GitHub APIs
    - registry.terraform.io
    - releases.hashicorp.com
    - management.azure.com
    - custom-api.example.com
```

---

## Skill 4: Workflow Compilation & Debugging

### Description
Compile workflows and resolve common compilation errors.

### Compilation Commands

```bash
# Compile single workflow
gh aw compile workflow-name

# Compile all workflows
gh aw compile

# Force recompile
gh aw compile --force workflow-name

# Validate without compiling
gh aw validate workflow-name
```

### Common Compilation Errors & Fixes

#### Error: Invalid tool value for `edit`
**Problem:**
```yaml
tools:
  read: null   # ❌ 'read' is not a valid tool
  edit: null   # ❌ null not valid for edit
  edit: true   # ❌ true not valid for edit
```

**Solution:**
```yaml
tools:        # ✅ bare keys
  edit:
  bash:
```

#### Error: Write permissions blocked by strict mode
**Problem:**
```yaml
permissions:
  contents: write       # ❌ blocked by strict mode
  pull-requests: write  # ❌ blocked by strict mode
```

**Solution:**
```yaml
permissions:           # ✅ read-only
  contents: read
  pull-requests: read
safe-outputs:          # ✅ write operations go here
  create-pull-request: null
```

#### Error: `pull_request` trigger requires `types`
**Problem:**
```yaml
on:
  pull_request:        # ❌ bare null not valid
  workflow_dispatch: null  # ❌ null not valid
```

**Solution:**
```yaml
on:
  workflow_dispatch:   # ✅ bare key
  pull_request:        # ✅ explicit types
    types: [opened, synchronize, reopened]
```

#### Error: Missing permission for toolset
**Problem:**
```yaml
tools:
  github:
    toolsets: [default]  # includes 'issues' toolset
permissions:
  contents: read          # ❌ missing 'issues: read', compiler warns
```

**Solution:**
```yaml
tools:
  github:
    toolsets: [pull_requests]  # ✅ only what you need
permissions:
  contents: read
  pull-requests: read
```

#### Error: "got array, want object" for tools
**Problem:**
```yaml
tools: ['bash', 'read', 'edit']  # ❌ Wrong
```

**Solution:**
```yaml
tools:  # ✅ Correct
  bash:
  edit:
```

#### Error: Boolean default must be string
**Problem:**
```yaml
workflow_dispatch:
  inputs:
    enabled:
      type: boolean
      default: true  # ❌ Wrong
```

**Solution:**
```yaml
workflow_dispatch:
  inputs:
    enabled:
      type: boolean
      default: "true"  # ✅ Correct (quoted)
```

#### Error: Invalid safe-output field name
**Problem:**
```yaml
safe-outputs:
  create_pull_request: null  # ❌ Wrong (underscore)
```

**Solution:**
```yaml
safe-outputs:
  create-pull-request: null  # ✅ Correct (hyphen)
```

#### Error: Import download failed
**Problem:**
```yaml
imports:
  - https://raw.githubusercontent.com/owner/repo/main/agent.md  # ❌ Wrong
```

**Solution:**
```yaml
imports:
  - owner/repo/.github/agents/agent.md@main  # ✅ Correct
```

#### Error: Safe-outputs format
**Problem:**
```yaml
safe-outputs: [create-issue, create-pull-request]  # ❌ Wrong (array)
```

**Solution:**
```yaml
safe-outputs:  # ✅ Correct (object)
  create-issue: null
  create-pull-request: null
```

---

## Extended Patterns & Reference

For deployment, testing, troubleshooting, performance optimization, security best practices, and quick reference, see [references/GH-AW-PATTERNS.md](references/GH-AW-PATTERNS.md).

### Deployment Checklist
