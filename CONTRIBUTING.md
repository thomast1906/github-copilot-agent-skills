# Contributing to the GitHub Copilot Agent Skills Showcase

## How Content Works

This site uses **Astro Content Collections** — no code changes needed. Drop a `.md` file in the right folder → it automatically appears on the site after the next build.

Content lives in four folders under `src/content/`:
- `src/content/skills/` — Individual agent skills
- `src/content/agents/` — Agent definitions
- `src/content/packages/` — APM bundle packages
- `src/content/mcp-servers/` — MCP server integrations

Each file must include required frontmatter (defined in `src/content.config.ts`). The filename becomes the **slug** (e.g., `azure-pricing.md` → slug `azure-pricing`).

---

## Adding a New Skill

Create a new file in `src/content/skills/` with the naming pattern `skill-name.md`.

```markdown
---
name: My Skill Name
category: azure-architecture
status: stable
mcp: []
featured: false
---

Write a 1-2 sentence description here. This appears on the skill card.
```

**Field reference:**
- `name` — Display name (required)
- `category` — Skill category (required; see valid values below)
- `status` — `stable` or `wip` (required)
- `mcp` — List of MCP server names this skill uses (optional; default `[]`)
- `featured` — Set `true` to feature on homepage (optional; default `false`)

---

## Adding a New Agent

Create a new file in `src/content/agents/` with the naming pattern `agent-name.md`.

```markdown
---
name: My Agent Name
file: my-agent.agent.md
skills:
  - skill-slug-1
  - skill-slug-2
package: package-slug
---

Agent description paragraph here.
```

**Field reference:**
- `name` — Display name (required)
- `file` — Filename of the agent definition file in the repo (required)
- `skills` — List of skill slugs this agent uses (required; must match existing skill filenames without `.md`)
- `package` — Package slug, or `null` if not in a package (required)

---

## Adding a New APM Package

Create a new file in `src/content/packages/` with the naming pattern `package-name.md`.

```markdown
---
name: My Package Bundle
installCommand: apm install thomast1906/github-copilot-agent-skills/packages/my-package --runtime vscode
agents:
  - agent-slug-1
skills:
  - skill-slug-1
mcp: []
featured: false
---

Package description paragraph here.
```

**Field reference:**
- `name` — Display name (required)
- `installCommand` — APM install command (required)
- `agents` — List of agent slugs in this package (required)
- `skills` — List of skill slugs in this package (required)
- `mcp` — List of MCP servers (optional; default `[]`)
- `featured` — Set `true` to feature on homepage (optional; default `false`)

---

## Adding a New MCP Server

Create a new file in `src/content/mcp-servers/` with the naming pattern `server-name.md`.

```markdown
---
name: My MCP Server
installation: "Extension: my-extension-id"
skills:
  - skill-slug-1
required: false
---

What this MCP server provides.
```

**Field reference:**
- `name` — Display name (required)
- `installation` — Installation instructions (required)
- `skills` — List of skill slugs that use this server (required)
- `required` — `true` or `false` (required)

---

## Valid Skill Categories

Use one of these values for the `category` field in skills:
- `azure-architecture`
- `azure-apim`
- `infrastructure-as-code`
- `diagramming`
- `github-workflows`

---

## How Skills and Slugs Work

- The **slug** is the filename without `.md`
  - Example: `azure-pricing.md` → slug `azure-pricing`
- Skills referenced in agents and packages **must match an existing skill slug**
- Reuse the same slug when linking content together

---

## After Adding Content

Push your changes to `main` (or open a PR). GitHub Actions automatically builds and deploys the site — no manual steps needed.

