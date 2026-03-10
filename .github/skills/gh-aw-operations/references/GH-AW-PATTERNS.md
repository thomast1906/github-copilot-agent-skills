## Skill 5: Workflow Testing & Deployment

### Description
Deploy and test agentic workflows in GitHub Actions.

### Deployment Checklist

1. **Compile Workflow**
   ```bash
   gh aw compile workflow-name
   ```
   - Verify 0 errors
   - Check warnings (informational only)

2. **Commit Files**
   ```bash
   git add .github/workflows/workflow-name.md
   git add .github/workflows/workflow-name.lock.yml
   git commit -m "feat: Add workflow-name agentic workflow"
   git push
   ```

3. **Enable PR Creation** (if using `create-pull-request`)
   - Go to: Settings → Actions → General
   - Check: ✓ Allow GitHub Actions to create and approve pull requests
   - Save

4. **Configure Secrets** (if needed)
   - Go to: Settings → Secrets and variables → Actions
   - Add required secrets (API keys, tokens, etc.)

5. **Test Workflow**
   - Navigate to: Actions tab
   - Select workflow
   - Click "Run workflow"
   - Provide inputs
   - Monitor execution

### Testing Strategies

#### Strategy 1: Manual Trigger Testing
```yaml
on:
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'Dry run mode (no actual changes)'
        type: boolean
        default: "true"
```

Test without making real changes first.

#### Strategy 2: Branch Testing
```yaml
on:
  push:
    branches:
      - test/**
```

Test on dedicated test branches before enabling on main.

#### Strategy 3: Label-Based Testing
```yaml
on:
  issues:
    types: [labeled]
  # Only run when "test-workflow" label is added
```

Control execution via labels during testing.

---

## Skill 6: Import Reusable Agents & Skills

### Description
Use imports to leverage reusable agents and skills from other repositories.

### Import Patterns

#### Import External Agent
```yaml
imports:
  - thomast1906/github-copilot-skills-terraform/.github/agents/terraform-provider-upgrade.agent.md@main
```

**In markdown instructions:**
```markdown
Use your imported Terraform provider upgrade expertise to analyze
the current provider versions and recommend upgrades.
```

#### Import External Skill
```yaml
imports:
  - owner/repo/.github/skills/code-review/SKILL.md@main
  - owner/repo/.github/skills/security-scan/SKILL.md@main
```

**In markdown instructions:**
```markdown
Apply your code review and security scanning skills to analyze
the changes in this pull request.
```

#### Import Multiple Resources
```yaml
imports:
  - owner/repo/.github/agents/analyzer.agent.md@main
  - owner/repo/.github/skills/reporting/SKILL.md@main
  - owner/repo/.github/skills/validation/SKILL.md@main
```

### Import Best Practices

1. **Pin to specific refs when stable:**
   ```yaml
   imports:
     - owner/repo/.github/agents/agent.md@v1.2.0  # Tag
     - owner/repo/.github/agents/agent.md@abc1234  # Commit SHA
   ```

2. **Use main/master for latest:**
   ```yaml
   imports:
     - owner/repo/.github/agents/agent.md@main
   ```

3. **Imports are cached in `.github/aw/imports/`**
   - Committed to repository
   - Updated on recompilation
   - Version-locked for consistency

---

## Skill 7: Common Workflow Patterns

### Description
Pre-built patterns for common automation scenarios.

### Pattern: Dependency Upgrade Workflow

```yaml
---
on:
  workflow_dispatch:
    inputs:
      target_version:
        description: 'Target version (leave empty for latest)'
        required: false
        type: string
  schedule:
    - cron: '0 9 * * 1'  # Weekly Monday 9 AM

engine: copilot

permissions:
  contents: read
  pull-requests: read

tools:
  edit:
  github:
    toolsets: [pull_requests]

safe-outputs:
  create-pull-request:
    title-prefix: "[dependency] "
    labels: [dependencies, automation]
    draft: true
    reviewers: [copilot]
    expires: 14
  create-issue:
    title-prefix: "[dependency] "
    labels: [dependencies, blocked]

network:
  allowed:
    - defaults
    - registry.npmjs.org
    - registry.terraform.io
---

# Dependency Upgrade Workflow

Automatically upgrade project dependencies to latest compatible versions.

## Your Task

1. Scan current dependencies
2. Check for available upgrades
3. Analyze breaking changes
4. Create PR with upgrades or issue if blocked
```

### Pattern: Code Analysis & Reporting

```yaml
---
on:
  workflow_dispatch:
  pull_request:
    types: [opened, synchronize]

engine: copilot

permissions:
  contents: read
  pull-requests: read

tools:
  edit:
  github:
    toolsets: [pull_requests]

safe-outputs:
  add-comment:
    target: "triggering"
  create-pull-request-review-comment:
    max: 10
  add-labels:
    allowed: [needs-review, lgtm, requires-changes]
---

# Code Analysis Workflow

Analyze code quality and provide feedback on pull requests.

## Your Task

Review the PR changes and provide:
1. Code quality feedback
2. Security concerns
3. Best practice suggestions
4. Inline comments on specific issues
```

### Pattern: IssueOps/ChatOps

```yaml
---
on:
  issues:
    types: [opened, labeled]
  issue_comment:
    types: [created]

engine: copilot

permissions:
  contents: read
  issues: read

tools:
  github:
    toolsets: [issues]

safe-outputs:
  add-comment: null
  update-issue: null
  add-labels:
    allowed: [in-progress, completed, needs-info]
  close-issue: null
---

# IssueOps Workflow

Respond to issue commands and manage issue lifecycle.

## Your Task

When an issue is created or commented on:
1. Parse commands (e.g., /analyze, /report, /close)
2. Execute the requested operation
3. Report results as comment
4. Update issue labels/status
```

---

## Skill 8: Troubleshooting Guide

### Description
Diagnose and fix common issues with agentic workflows.

### Issue: Workflow Not Appearing in Actions UI

**Symptoms:**
- Workflow file exists but doesn't show in Actions tab
- Can't manually trigger workflow

**Diagnosis:**
```bash
# Check if lock file was generated
ls -la .github/workflows/*.lock.yml

# Check if files are committed
git status

# Verify compilation succeeded
gh aw compile workflow-name
```

**Solutions:**
1. Ensure both `.md` and `.lock.yml` are committed and pushed
2. Verify `workflow_dispatch` trigger is configured
3. Check repository Settings → Actions to ensure workflows are enabled

### Issue: PR Creation Fails

**Symptoms:**
```
Warning: Failed to create pull request: GitHub Actions is not permitted to create or approve pull requests.
```

**Solution:**
1. Go to: Settings → Actions → General
2. Scroll to: "Workflow permissions"
3. Check: ✓ Allow GitHub Actions to create and approve pull requests
4. Click Save

### Issue: MCP Server Not Working

**Symptoms:**
- Tools from MCP server not available
- Connection timeouts

**Diagnosis:**
```yaml
# Check container image is correct
mcp-servers:
  terraform:
    container: "hashicorp/terraform-mcp-server:0.3.3"  # Verify version
```

**Solutions:**
1. Verify container image exists and is accessible
2. Check network allowlist includes required domains
3. Verify environment variables are set correctly
4. Check container logs in workflow run

### Issue: Import Not Resolving

**Symptoms:**
```
Error: Failed to download import: owner/repo/path@ref
```

**Solutions:**
1. Verify repository is public or accessible with token
2. Check path is correct: `.github/agents/name.agent.md`
3. Verify branch/tag/SHA exists
4. Use correct format: `owner/repo/path@ref` (not raw URL)

---

## Skill 9: Performance Optimization

### Description
Optimize workflow execution time and resource usage.

### Optimization Techniques

#### 1. Minimize MCP Server Usage
```yaml
# Only allow specific tools needed
mcp-servers:
  terraform:
    allowed: ["analyze_version", "detect_breaking_changes"]  # Not "*"
```

#### 2. Set Appropriate Timeouts
```yaml
# Don't run indefinitely
on:
  workflow_dispatch:
    inputs:
      timeout_minutes:
        description: 'Maximum execution time'
        default: "30"
```

#### 3. Cache Results
```yaml
tools:
  cache-memory: null  # Enable caching
```

Use caching in instructions:
```markdown
Cache analysis results to avoid re-analyzing unchanged files.
```

#### 4. Limit Safe-Output Operations
```yaml
safe-outputs:
  create-pull-request-review-comment:
    max: 10  # Limit number of comments
```

#### 5. Use Concise Instructions
```markdown
# ❌ Avoid overly verbose instructions
Please very carefully analyze every single line...

# ✅ Be concise and clear
Analyze changes and report findings.
```

---

## Skill 10: Security Best Practices

### Description
Implement secure configurations for agentic workflows.

### Security Checklist

#### Minimal Permissions
```yaml
permissions:
  contents: read  # Only write if absolutely necessary
  pull-requests: write  # Only if creating PRs
  issues: write  # Only if creating issues
```

#### Secret Management
```yaml
mcp-servers:
  custom:
    env:
      API_KEY: ${{ secrets.API_KEY }}  # Use secrets, not hardcoded values
```

#### Network Restrictions
```yaml
network:
  allowed:
    - defaults
    - specific-domain.com  # Only allow required domains
    # Don't use wildcards or overly broad allowlists
```

#### Input Validation
```yaml
on:
  workflow_dispatch:
    inputs:
      target:
        type: choice  # Use choice instead of string when possible
        options: [dev, staging, prod]
```

#### Safe-Output Restrictions
```yaml
safe-outputs:
  add-labels:
    allowed: [bug, enhancement]  # Restrict which labels can be added
  add-reviewer:
    reviewers: [team-lead, copilot]  # Restrict who can be assigned
```

---

## Quick Reference Card

### File Structure
```
.github/
├── workflows/
│   ├── workflow-name.md          # Your workflow definition
│   └── workflow-name.lock.yml    # Generated (committed)
├── agents/
│   └── agent-name.agent.md       # Reusable agents
└── skills/
    └── skill-name/
        └── SKILL.md               # Reusable skills
```

### Essential Commands
```bash
# Compile workflow
gh aw compile workflow-name

# Compile all workflows
gh aw compile

# Validate workflow
gh aw validate workflow-name

# List workflows
gh aw list
```

### Frontmatter Quick Template
```yaml
---
on:
  workflow_dispatch:            # bare key — no null
  pull_request:
    types: [opened, synchronize, reopened]  # always specify types
engine: copilot
permissions:
  contents: read                # never write — strict mode blocks it
  pull-requests: read           # match only what your toolsets need
tools:
  edit:                         # bare key — enables file read/edit
  github:
    toolsets: [pull_requests]   # only what you need
safe-outputs:
  create-pull-request: null     # all write ops go here
network:
  allowed: [defaults]
---
```

### Common Safe-Outputs
- `create-pull-request` - Code changes
- `create-issue` - Reports/alerts
- `add-comment` - Status updates
- `update-issue` - Track progress
- `add-labels` - State management

### Debug Workflow Issues
1. Check compilation: `gh aw compile workflow-name`
2. Verify files committed: `git status`
3. Check Actions enabled: Settings → Actions
4. Enable PR creation: Settings → Actions → General
