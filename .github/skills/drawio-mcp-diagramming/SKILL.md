---
name: drawio-mcp-diagramming
description: "Create and edit diagrams using the Draw.io MCP server — any shape, any vendor. USE FOR: draw me a diagram, create an architecture diagram, add Azure/AWS/GCP/Cisco/Kubernetes icons to a diagram, convert Mermaid to draw.io, fix overlapping arrows, edit a .drawio file, network topology diagrams, CI/CD pipeline diagrams, auth flow diagrams. Supports XML, Mermaid, and CSV. Uses drawio/search_shapes to find any of 10,000+ shapes across all vendor and icon libraries. DO NOT USE FOR: Excalidraw output (use excalidraw-mcp-diagramming skill)."
metadata:
  author: Thomas Thornton
  version: "1.2.0"
  last-updated: "2026-10-07"
---

# Draw.io MCP Diagramming Skill

Create or update diagrams via the Draw.io MCP server. Before generating XML, read [references/xml-authoring-rules.md](references/xml-authoring-rules.md) — hard constraints, container rules, and edge routing guidance that prevent the most common rendering failures. For layout anti-pattern fixes, see [references/layout-antipatterns.md](references/layout-antipatterns.md). For cloud topology conventions, icon libraries, and worked examples, see [references/azure.md](references/azure.md), [references/aws.md](references/aws.md), and [references/gcp.md](references/gcp.md).

For diagrams that use only basic shapes (flowcharts, UML, ERD, org charts, mind maps, timelines, wireframes), skip icon discovery and proceed directly to `drawio/create_diagram` or `drawio/open_drawio_mermaid`.

## When to Use

- The user asks to create or refine architecture diagrams (Azure, AWS, multi-cloud, or generic).
- The user wants draw.io/diagrams.net output from an MCP workflow.
- The user asks for **Mermaid → draw.io** conversion.
- The user asks for **CSV → draw.io** conversion (org charts, flowcharts from tabular data).
- The user needs Azure service icons in diagrams.
- The user needs AWS service icons in diagrams.
- The user reports that Azure or AWS icons/shapes are not appearing.
- The user asks for an **auth or identity flow** (OAuth 2.0, OIDC, JWT validation, SSO, login, token exchange, Entra, Cognito).
- The user asks for an **API or microservice interaction diagram** (request/response chain, service-to-service calls, API gateway flow).
- The user asks for a **CI/CD pipeline or deployment workflow** (build, test, deploy stages, GitHub Actions, Azure DevOps, approval gates).
- The user wants to **edit an existing multi-page `.drawio` file** (Tool Server only).

## Required Tooling

Draw.io provides two MCP server variants. The skill works with either; call the tools that match the configured server.

### Option A — Hosted App Server (inline / "Open in draw.io" button)

- MCP tools: `drawio/create_diagram`, `drawio/search_shapes`, `drawio/get_drawio_reference`
- Workspace MCP config:

```json
{
  "servers": {
    "drawio": {
      "type": "http",
      "url": "https://mcp.draw.io/mcp"
    }
  }
}
```

Supported inputs: `xml` (draw.io XML), `mermaid` (Mermaid.js text).
Optional layout passes: `postLayout: "elk"`, `routing: "libavoid"`.

### Option B — stdio Tool Server (opens draw.io in browser)

- MCP tools: `drawio/open_drawio_xml`, `drawio/open_drawio_mermaid`, `drawio/open_drawio_csv`, `drawio/search_shapes`, `drawio/get_drawio_reference`, `drawio/list_pages`, `drawio/get_page`, `drawio/set_page`
- Workspace MCP config:

```json
{
  "servers": {
    "drawio": {
      "command": "npx",
      "args": ["-y", "@drawio/mcp"]
    }
  }
}
```

Supported inputs: XML, Mermaid, CSV.
Optional layout pass: `routing: "libavoid"` on `open_drawio_xml` — **requires `@drawio/mcp` v1.3.0 or later**. On older versions the parameter is ignored, so pin with `npx -y @drawio/mcp@latest` if connector routing does not improve.

> Use **Option A** for supported inline hosts, including VS Code with GitHub Copilot, Claude.ai, and Cursor. It is the server configured by this repository's APM packages. Use **Option B** when you specifically need browser-editor workflows, CSV import, or direct multi-page file editing.

### Canonical generation reference (required)

Before the first diagram in **each format** in a conversation, call
`drawio/get_drawio_reference` for that format: request the XML reference before
generating or editing XML, and the Mermaid reference before generating Mermaid.
Treat the returned server reference as authoritative. If it conflicts with this
skill or a local reference, follow it and update this repository later.

### Icon discovery tool (both servers)

- MCP tool: `drawio/search_shapes` — search 10,000+ draw.io shapes and return ready-to-use style strings.
- Parameters: `query` (space-separated keywords) and optional `limit` (default 10, max 50). Raise `limit` when a first search returns nothing usable, before concluding a shape does not exist.

### Tool name detection

MCP hosts may register tools with a server prefix (e.g. `mcp_drawio-mcp-ap_create_diagram` and `mcp_drawio-mcp-ap_search_shapes`). If `tool_search` does not surface the drawio tools, inspect the available or deferred tools list and call the exact names shown there. Do not assume a tool is unavailable if it appears in the deferred list; use the exact registered name.

### VS Code / GitHub Copilot: run shape searches sequentially

In VS Code and GitHub Copilot, parallel tool calls are cancelled if the user sends a new message while they are in flight. Always run `drawio/search_shapes` calls **one at a time** — never in parallel batches.

### XML hard constraints, containers, and edge routing

The draw.io MCP server enforces strict XML rules, and the most common quality failures are flattened hierarchy and hand-routed edges. Before generating any XML, read [references/xml-authoring-rules.md](references/xml-authoring-rules.md) which covers:

- **Hard constraints** — forbidden constructs that cause the server to return a render error (XML comments, duplicate IDs, self-closing edge/geometry elements, unescaped characters)
- **Container rules** — nested `swimlane` containment, relative child coordinates, and why cross-container edges must sit at `parent="1"`
- **Edge routing** — let `routing: "libavoid"` or `postLayout: "elk"` compute paths; the narrow cases where manual connection points are justified
- **Pre-generation edge checklist** — run before writing edge XML for any infrastructure diagram

## Recommended Workflow

1. **Identify the input format and diagram type**
   - For flowcharts, sequence diagrams, ERD, mind maps, Gantt, timelines, kanban: prefer **Mermaid** if the Tool Server is available, or use the App Server's `mermaid` parameter.
   - For org charts or flowcharts from tabular data: use **CSV** with the Tool Server (`drawio/open_drawio_csv`).
   - For diagrams with named services, vendor shapes, or pictorial icons: use **XML** (`drawio/create_diagram` or `drawio/open_drawio_xml`).

2. **Load the canonical server reference** — call `drawio/get_drawio_reference` once per selected format (XML or Mermaid) before its first use in the conversation. Its instructions override this repository if they differ.

3. **Use `drawio/search_shapes` for any non-geometric shape** — it searches all 10,000+ shapes across every draw.io library and returns ready-to-use style strings.
   - Use it for cloud services (Azure, AWS, GCP), network equipment (Cisco, Juniper), container/orchestration tools (Kubernetes, Docker), brand logos (Slack, GitHub), IT infrastructure shapes, and any other named component.
   - Example queries: `"azure virtual machine"`, `"aws lambda"`, `"cisco router"`, `"kubernetes pod"`, `"slack"`, `"docker"`.
   - Use the returned style string directly in the XML cell (see Icon Discovery below for the hard gate and fallback flow).
   - Skip `search_shapes` only for diagrams that use purely geometric shapes: rectangles, diamonds, circles, and arrows.

4. **When to use `search_shapes` vs skip it** — if a shape has a recognised name, brand, or product identity, always look it up via `search_shapes` first. Only skip it for standard geometric diagrams (flowcharts, UML, ERD, org charts, mind maps, timelines, wireframes) that need no pictorial icons. For sequence and flow diagrams, apply Sequence and Flow Diagram Patterns (see section below).

5. **Nest groupings with real containers, not stacked rectangles** — for any diagram with hierarchy (VNet → Subnet → resource, VPC → AZ → instance, Region → Environment → Service, swimlanes), make each level a `swimlane;startSize=24;` container, set `parent="<container_id>"` on children, and give children coordinates **relative to their parent**. Edges between cells in *different* containers must use `parent="1"` or they render inside the container and get clipped. Drawing a large rectangle and positioning shapes on top of it at absolute coordinates is the anti-pattern the draw.io XML reference explicitly calls out — it breaks move/resize, collapse, and layout passes.

6. **Keep labels unique and sparse** — if several edges say the same thing, collapse them into one labelled flow or a single note box. Do not repeat the same wording in the title, legend, lane name, and callout; each text element should have one job.

7. **For cloud infrastructure diagrams, load the vendor reference** — read [references/azure.md](references/azure.md) for anything with VNets, subnets, or Azure icons, [references/aws.md](references/aws.md) for anything with VPCs, AZs, or AWS icons, and [references/gcp.md](references/gcp.md) for anything with VPCs, regional subnets, or GCP icons. Read all that apply for multi-cloud diagrams. Each covers that vendor's icon library and caveats, container structure, colour palette, annotation boxes, a complete worked example, and a topology checklist. GCP's networking model (global VPC, regional subnets, VPC-level firewall rules) is not a direct analogue of Azure's or AWS's — read [references/gcp.md](references/gcp.md) even if you are confident with Azure/AWS conventions.

8. **Build the payload**
   - XML: valid `mxGraphModel` using verified icons/style strings.
   - Mermaid: valid Mermaid.js definition (App Server: pass as `mermaid`; Tool Server: use `drawio/open_drawio_mermaid`).
   - CSV: valid CSV content (Tool Server: use `drawio/open_drawio_csv`).

9. **Call the appropriate tool**
   - App Server: `drawio/create_diagram` with `xml` or `mermaid`.
   - Tool Server: `drawio/open_drawio_xml`, `drawio/open_drawio_mermaid`, or `drawio/open_drawio_csv`.

10. **Decide the layout pass before writing XML, then let it route the edges**
   - `routing: "libavoid"` — keeps your hand-placed coordinates and only reroutes connectors around shapes. This is the default for topology, architecture, deployment, and container-based diagrams.
   - `postLayout: "elk"` — full re-layout that replaces your vertex positions. Use for directional/hierarchical XML (pipelines, decision flows). Add `direction: "horizontal"` when the flow reads left-to-right — it defaults to `vertical`, which is why left-to-right CI/CD pipelines come out stacked.
   - Do **not** combine `postLayout` and `routing` — ELK already routes its own edges. `direction` is XML-only and ignored for Mermaid (Mermaid takes direction from `flowchart TD/LR`).
   - Do **not** hand-write `exitX`/`entryX` or `<Array as="points">` waypoints. The routing pass computes them, and manual values fight it. See [references/xml-authoring-rules.md](references/xml-authoring-rules.md) for the narrow exceptions.

11. If the user wants a file artifact, save as `.drawio` wrapped in `<mxfile><diagram>...</diagram></mxfile>`. **Read [references/standalone-file-requirements.md](references/standalone-file-requirements.md) before writing any `.drawio` file by hand** (or whenever the MCP tools are unavailable) — the MCP tools add `as="geometry"` and the `mxGraphModel` layout attributes for you, and without them every element collapses to the origin.

12. Keep labels concise and explicit (service name + role).

13. Prefer one icon per major component or service; use edges for flow semantics (ingress/egress/dependency/telemetry).

## Input Format Quick Reference

Choose the input that matches the diagram type and configured server.

| Input | Best for | App Server | Tool Server |
|---|---|---|---|
| **XML** | Architecture/topology diagrams with vendor or pictorial icons, custom layouts | `drawio/create_diagram` with `xml` | `drawio/open_drawio_xml` |
| **Mermaid** | Flowcharts, sequence, class, ER, state, mindmap, Gantt, timeline, kanban | `drawio/create_diagram` with `mermaid` | `drawio/open_drawio_mermaid` |
| **CSV** | Org charts, flowcharts, simple diagrams from tabular data | Not supported | `drawio/open_drawio_csv` |

Use Mermaid for standard diagram types; use XML when the user needs pictorial or vendor-specific icons, precise positioning, complex containers, or custom styling. See [references/REFERENCE.md](references/REFERENCE.md) for Mermaid/CSV examples and multi-page editing details.

## Visual Quality Guardrails

Apply these defaults unless the user explicitly asks for a dense/technical view:

- Use 3-4 major lanes/zones max (for example Source → Process → Destination).
- Keep primary flow left-to-right with a single main path.
- Use stage numbering (`1`, `2`, `3`, `4`) instead of many edge labels.
- Keep one icon per major component; avoid icon-per-step layouts.
- Limit cross-lane dashed lines to one security/auth line and one optional telemetry line.
- **Edge density**: for nodes with 3+ outgoing edges, reduce duplicates first (for example one gateway → one aggregated backend edge). Then let `routing: "libavoid"` separate what remains — only add explicit `exitX`/`exitY` if a specific edge is still ambiguous after routing.
- Keep text concise (single purpose per box) and avoid multiline overload.
- Keep edge labels short and unique; if adjacent edges repeat the same protocol/port wording, collapse them or move the shared detail to one annotation box.
- Avoid repeating the same label in the title, legend, lane name, and callout.
- **Animated flow on connectors**: keep diagrams static by default. Add `flowAnimation=1;` only when the user requests animation; it renders a moving dot along the arrow and is useful for data-flow and pipeline diagrams.
- Prefer a "clean" variant first; add detail only if requested.

For worked examples of common layout problems (stacked edges, repeated labels, observability inside VNet, etc.), see [references/layout-antipatterns.md](references/layout-antipatterns.md).

## Cloud Infrastructure Topology (Azure, AWS, and GCP)

Vendor-specific topology guidance lives in per-cloud reference files. Load the one that matches the diagram — or more than one for multi-cloud:

- **Azure** — [references/azure.md](references/azure.md): read for any diagram with VNets, subnets, or Azure icons. Covers the azure2 and mscae icon libraries and their caveats, nested VNet → subnet container structure, colour and border conventions, traffic palette, annotation boxes, a complete worked example, and the Azure topology checklist.
- **AWS** — [references/aws.md](references/aws.md): read for any diagram with VPCs, AZs, or AWS icons. Covers the AWS4 stencil library and its caveats, nested VPC → AZ → subnet container structure, subnet-tier colour coding, NAT/IGW egress paths, security group annotation, a complete worked example, and the AWS topology checklist.
- **GCP** — [references/gcp.md](references/gcp.md): read for any diagram with VPCs, regional subnets, or GCP icons. Covers the gcp2 stencil library and its caveats, the global-VPC/regional-subnet container model (not a direct analogue of Azure's or AWS's), VPC-level firewall-rule annotation, a complete worked example, and the GCP topology checklist.

Shared rules that apply to all three — containment, edge routing, and hard XML constraints — stay in [references/xml-authoring-rules.md](references/xml-authoring-rules.md).


## Sequence and Flow Diagram Patterns

Use this section for diagrams that show **temporal flows** — what happens in order — rather than infrastructure topology. No shape lookup via `drawio/search_shapes` is required.

### When to Apply

| Diagram type | Keywords | Layout |
|---|---|---|
| Auth / authorisation flow | OAuth, OIDC, JWT, SSO, login, token exchange, Entra, Cognito | Swimlane interaction flow |
| API / microservice call chain | REST, GraphQL, request/response, service-to-service, API gateway | Swimlane or vertical flowchart |
| CI/CD pipeline | pipeline, build, deploy, release, GitHub Actions, Azure DevOps, approval gate | Horizontal pipeline flowchart |

### Layout Approach

**Swimlane interaction flow** (auth / API flows with 2–5 actors):
- Use flat `swimlane` lanes stacked vertically at `parent="1"`, one actor per lane: `swimlane;horizontal=0;startSize=110;fillColor=<pastel>;html=1;` with geometry `x=0, y=lane_index*150, width=CANVAS_W, height=150`
- Step boxes are children of their lane (`parent="<lane_id>"`) with coordinates relative to the lane: `x = 120 + col*180`, `y = 45`, size `140x60` (`140x80` for decision diamonds). The `x=120` start clears the 110px title area
- Number steps (`1.`, `2.`, `3.`) in the label so execution order is unambiguous
- Cross-lane edges must sit at `parent="1"`, not inside a lane, or they are clipped
- Use `edgeStyle=orthogonalEdgeStyle;` and let the routing pass place the bends
- Canvas width: `max_col * 180 + 300`; do not nest lanes inside a pool or vary lane heights
- Canvas height: `actor_count * 150 + 100`

**Horizontal pipeline flowchart** (CI/CD):
- Stages flow left-to-right: Source → Build → Test → Staging → Approval → Production
- Use `rounded=1` rectangles for stages, `rhombus` shape for gate / decision points
- Colour-code each stage box using the Stage Colours table below
- Failure branch goes downward from the gate with a red edge to a Rollback/Notify step
- Pass `postLayout: "elk"` with `direction: "horizontal"` — without `direction` the default vertical pass stacks the pipeline top-to-bottom
- Canvas: `pageWidth="1700" pageHeight="600"`

### Colour Conventions

Use the sequence, participant, and pipeline palettes in [references/REFERENCE.md](references/REFERENCE.md#sequence-and-flow-styles). The vendor topology references remain the source for cloud-specific palettes.

### Flow Animation

`flowAnimation=1;` works on sequence/flow edges exactly as in topology diagrams. Keep the default static; apply it only when the user asks for animated flow.

### Checklist (Sequence/Flow Diagrams)

- [ ] Diagram type identified (auth flow / API flow / CI/CD pipeline)
- [ ] Actors / participants labelled clearly
- [ ] Steps numbered in execution order
- [ ] Edge colours consistent with conventions above
- [ ] Error / failure paths shown in red
- [ ] Animation applied only when the user requested it
- [ ] Canvas sized appropriately for participant count and step depth

## Icon Discovery

Use `drawio/search_shapes` as the only source of styles for named, branded, or pictorial shapes. Use the returned `style` value unchanged; never infer or fabricate one. See [references/REFERENCE.md](references/REFERENCE.md#shape-discovery) for queries, style formats, and the fallback procedure.

## Exporting Diagrams

See [references/REFERENCE.md](references/REFERENCE.md#exporting-diagrams) for export formats and animation limitations.

## Troubleshooting Checklist

- Confirm the configured MCP server appears in `MCP: List Servers`.
- Run `MCP: Reset Cached Tools` if tool list is stale.
- **XML comments (`<!-- -->`) are forbidden** — the MCP server rejects them. Remove all comments before submitting.
- Ensure XML is otherwise well-formed (no malformed tags, no duplicate IDs, no unescaped `<`/`>`/`&` in style strings).
- **Z-order**: when shapes are siblings at `parent="1"`, background rectangles must be defined **before** the icons they sit behind, or they render on top. Using real containers (`swimlane`, `container=1`) avoids the problem entirely — children always render above their parent.
- **`html=1` in style** is required for any cell whose `value` contains HTML tags (`<b>`, `<br>`, `<i>`). Newlines via `&#xa;` work without it.
- **`sketch=0` in search results**: if `drawio/search_shapes` returns a style string containing `sketch=0`, preserve it exactly — omitting it enables the hand-drawn sketch rendering mode for that shape.
- **Icon sizes**: use dimensions as returned by `search_shapes`; they reflect the intended aspect ratio. When normalising a row of icons for visual consistency, 64×64 is a safe common size. Never change the aspect ratio of an icon that has `aspect=fixed` in its style.
- **Azure / AWS / GCP icon rendering**: vendor-specific style rules and fixes are in [references/azure.md](references/azure.md), [references/aws.md](references/aws.md), and [references/gcp.md](references/gcp.md).
- Reopen diagram in web draw.io if VS Code extension rendering differs.
- If an icon looks wrong, use `drawio/search_shapes` for an alternative exact style string.

## Prompt Templates and Checklists

See [references/REFERENCE.md](references/REFERENCE.md) for diagram-type prompt presets and [references/layout-antipatterns.md](references/layout-antipatterns.md) for the pre-flight layout checklist.

## Definition of Done

- The correct input format and MCP tool were chosen (XML, Mermaid, or CSV; App Server or Tool Server).
- All icon/style strings confirmed via `drawio/search_shapes` before generating; unconfirmed icons are not used.
- Diagram renders correctly; XML/Mermaid/CSV is valid and opens in draw.io.
- All named components identifiable via correct icons and clear labels.
- Layout pass chosen deliberately (`routing: "libavoid"` for hand-placed/container layouts; `postLayout: "elk"` — with `direction: "horizontal"` for left-to-right flows — for directional diagrams; never both).
- All applicable topology checklist items passed (borders, subnets, traffic labels, legend, isolation box, zones, canvas size).
- All applicable sequence/flow checklist items passed (numbered steps, colour-coded edges, error paths, canvas size).
- The diagram remains static unless the user requested `flowAnimation=1;` for specific edges.
- Nested groupings use real containers: each level a `swimlane`, children parented to their container with relative coordinates, cross-container edges at `parent="1"`.
- File artifact saved as `.drawio` (wrapped in `<mxfile>`) if requested, following [references/standalone-file-requirements.md](references/standalone-file-requirements.md).
- Edges declare only `source`/`target`: no hand-written `<Array as="points">` waypoints or `exitX`/`entryX` overrides unless a documented exception applies. See [references/xml-authoring-rules.md](references/xml-authoring-rules.md).
- Layout anti-patterns checked against [references/layout-antipatterns.md](references/layout-antipatterns.md) before finalising.
