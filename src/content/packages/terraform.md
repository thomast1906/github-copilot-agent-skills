---
name: Terraform Bundle
installCommand: apm install thomast1906/github-copilot-agent-skills/packages/terraform --runtime vscode
agents:
  - terraform-provider-upgrade
  - gh-aw-builder
skills:
  - terraform-provider-upgrade
  - gh-aw-operations
mcp:
  - Terraform MCP
featured: true
---

Automate Terraform provider upgrades and manage GitHub Actions workflows. Built for platform engineers managing infrastructure as code at scale.
