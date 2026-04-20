# APM MCP Configuration

Read this file when adding `mcp:` blocks to a package manifest. Covers all transport types, Docker patterns, input variables, and the Azure MCP exception.

**Official MCP docs:** https://microsoft.github.io/apm/
**VS Code mcp.json schema:** https://code.visualstudio.com/docs/copilot/chat/mcp-servers

---

## How MCP Config Works in APM

When a package has an `mcp:` block, APM merges those server entries into the target project's `.vscode/mcp.json` during install. This means users get the correct MCP servers wired up automatically — no manual editing.

APM only writes `.vscode/mcp.json` when it detects VS Code:
- `code` is on the PATH, **or**
- a `.vscode/` directory exists in the install target

If neither is true, always pass `--runtime vscode` at install time, or tell users to `mkdir -p .vscode` first.

---

## Transport Types

### HTTP — remote server, no local install

Use for cloud-hosted MCP servers. Nothing to run locally.

```yaml
mcp:
  - name: drawio
    registry: false
    transport: http
    url: "https://mcp.draw.io/mcp"
```

```yaml
mcp:
  - name: excalidraw
    registry: false
    transport: http
    url: "https://mcp.excalidraw.com"
```

**Codex warning note:** HTTP MCP servers produce a cosmetic warning when installed via APM into a Codex environment — Codex is stdio-only and cannot load HTTP transports. The install still succeeds and the entry is correctly written to `.vscode/mcp.json`. `target: vscode` does NOT suppress this warning.

---

### stdio — local process

Use when the MCP server runs as a local process. The `command` and `args` define how VS Code starts it.

#### Minimal stdio example

```yaml
mcp:
  - name: my-server
    registry: false
    transport: stdio
    command: npx
    args:
      - -y
      - my-mcp-package@latest
```

#### Docker-based stdio server

Use when the server is distributed as a Docker image. Requires Docker to be running on the user's machine.

```yaml
mcp:
  - name: terraform
    registry: false
    transport: stdio
    command: docker
    args:
      - run
      - -i
      - --rm
      - -e
      - TFE_TOKEN
      - -e
      - TFE_ADDRESS
      - hashicorp/terraform-mcp-server:0.3.3
    env:
      TFE_TOKEN: "${input:tfe_token}"
      TFE_ADDRESS: "${input:tfe_address}"
```

The `-e VAR_NAME` args pass the env vars through to the container. VS Code resolves `${input:key}` by prompting the user when the server first starts — they only need to enter values once.

---

## Input Variables

Use `${input:key}` for secrets or config values the user must supply. VS Code prompts once and caches the value per workspace.

```yaml
env:
  API_KEY: "${input:my_api_key}"
  BASE_URL: "${input:my_base_url}"
```

Name the input key descriptively (e.g. `tfe_token` not `token`) — the key becomes the VS Code prompt label.

---

## The Azure MCP Exception

**Do NOT add the Azure MCP server to a package's `mcp:` block.**

The Azure MCP server is registered automatically by the [Azure Tools VS Code extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azure-github-copilot). Adding it manually via APM would create a duplicate entry and potentially conflict.

Document this in your package README or skill description instead:

> The Azure MCP (used by azure-pricing, waf-assessment, cost-optimization, architecture-design) is provided by the **Azure Tools** VS Code extension — install that separately.

---

## Checklist — Adding MCP to a Package

- [ ] Correct transport type chosen (`http` for remote, `stdio` for local process)
- [ ] For Docker servers: documented that Docker must be running
- [ ] Secrets use `${input:key}` — no hardcoded credentials
- [ ] Azure MCP NOT included (extension-managed)
- [ ] Noted in skill/package description that MCP is required and what it enables
- [ ] Tested: install with `--runtime vscode` and confirm `.vscode/mcp.json` contains the entry
