---
name: excalidraw-mcp-diagramming
description: >-
  Create and edit diagrams on a live Excalidraw canvas using the Excalidraw MCP
  server. Use when asked to draw, diagram, sketch, or visualise architectures,
  workflows, data flows, system designs, flowcharts, mind maps, or sequence
  diagrams as an Excalidraw diagram. Trigger phrases include: "create an
  excalidraw", "draw me a diagram of", "make a flowchart", "visualise the
  system", "diagram this architecture", "export to PNG/SVG". Can export to PNG,
  SVG, .excalidraw file, or a shareable URL. Do NOT use for Draw.io or
  diagrams.net output (use drawio-mcp-diagramming instead).
---

# Excalidraw MCP Diagramming

Create diagrams on a live Excalidraw canvas that renders in the browser and
updates in real time. You are not generating a static file — you are painting
onto a shared whiteboard through MCP tools. The canvas persists between calls,
so what you put on it in one call is visible in the next screenshot.

## Required MCP Server

The `excalidraw` MCP server must be present in `.vscode/mcp.json`:

```json
{
  "servers": {
    "excalidraw": {
      "type": "http",
      "url": "https://mcp.excalidraw.com"
    }
  }
}
```

If the MCP tools are not available, tell the user to add the server and reload
VS Code, then stop.

## Available Tools

**Essential — use on every diagram:**

| Tool | Purpose | When |
|---|---|---|
| `read_diagram_guide` | Returns server-side colour palette and sizing rules | First call — before any elements |
| `batch_create_elements` | Creates multiple shapes and arrows atomically | Main workhorse |
| `get_canvas_screenshot` | Returns a photo of the current canvas | After every change — verify before continuing |
| `clear_canvas` | Wipes all content | Start of every new diagram |
| `set_viewport` | Scrolls and zooms to fit content | After creating elements |

**Secondary — use when needed:**

| Tool | When |
|---|---|
| `create_from_mermaid` | Quick drafts — 3–8 node sequential flows |
| `update_element` | Small corrections (position, colour, text) |
| `export_to_image` | User requests PNG or SVG file |
| `export_scene` | User requests editable `.excalidraw` file |
| `export_to_excalidraw_url` | User wants a shareable link |
| `describe_scene` | Audit what is currently on the canvas |

---

## Workflow

### Step 1 — Choose the Creation Path

**Mermaid path** — use for simple sequential flows (3–8 nodes, no zones):

```
create_from_mermaid(
  mermaidDiagram="graph TD; A[Frontend] -->|REST| B[API]; B -->|SQL| C[DB]"
)
```

Then jump to Step 6 (screenshot). Skip Steps 2–5.

**Batch path** — use for everything else: layered architectures, data flows,
hub-and-spoke, any diagram needing zones or colour-coded roles. Continue below.

### Step 2 — Read the Design Guide

```
read_diagram_guide()
```

Retrieve the server's current colour palette and sizing rules. This call is
mandatory — the values may differ from the defaults in this skill. The server
guide takes precedence.

### Step 3 — Clear and Confirm Empty

```
clear_canvas()
get_canvas_screenshot()   // must verify the canvas is truly empty
```

Previous diagrams leave ghost data even after `clear_canvas`. If any element
is visible in the screenshot, call `clear_canvas()` again before proceeding.
Do not skip this confirmation — ghost elements silently break arrow bindings
on new diagrams.

### Step 4 — Plan the Layout

Before writing any JSON, decide:

- **Which pattern?** — See [references/canvas-patterns.md](references/canvas-patterns.md)
  for coordinate templates. Load it now if you are unsure which pattern fits.
- **Column spacing** — Labeled arrows need ≥150px clear gap between boxes.
  Budget 440px column pitch (230px box + 210px gap) for labeled arrows.
- **Row pitch** — Allow ~350px per row (160px box height + 190px gap for
  arrows, labels, and breathing room).
- **Zone positions** — Calculate zone backgrounds before placing shapes.
  Zone background: `y = row_y - 50`, `height = box_height + 100`.

Sketch coordinates to paper or comments before writing the batch payload.

### Step 5 — Create in One Batch

Call `batch_create_elements` with **all elements in one payload**. Arrow
binding resolves at batch time — if the target shape and arrow are not in the
same call, the arrow will not connect.

**Element order within the `elements` array matters for render layering:**

1. Zone backgrounds (large dashed rectangles, low opacity 25–40)
2. Shapes (rectangles, ellipses, diamonds) — assign unique `id` to each
3. Arrows — reference shapes by `startElementId` / `endElementId`
4. Standalone text (titles, zone labels, side annotations)

### Step 6 — Screenshot and Verify

```
get_canvas_screenshot()
```

Inspect the image:
- Are all labels readable and unclipped by their containers?
- Do arrows land on the correct shapes?
- Are zone backgrounds behind their contents, not on top?
- Is there ≥150px of clear space around labeled arrows?
- Are connections logically correct?

### Step 7 — Adjust

Use `update_element` for small corrections. For shape replacements, use
`delete_element` + `batch_create_elements`, then screenshot again.

### Step 8 — Zoom to Fit

```
set_viewport({ scrollToContent: true })
```

### Step 9 — Export (if requested)

```
// PNG or SVG
export_to_image({ format: "png", filePath: "/path/to/output.png" })

// Editable JSON file
export_scene({ filePath: "/path/to/output.excalidraw" })

// Shareable link — no file needed
export_to_excalidraw_url()
```

---

## Shape Syntax

```json
{
  "type": "rectangle",
  "id": "api-server",
  "x": 440, "y": 200,
  "width": 230, "height": 160,
  "backgroundColor": "#d0bfff",
  "strokeColor": "#7048e8",
  "roughness": 0,
  "text": "API Server\nExpress.js"
}
```

- `roughness: 0` — crisp professional edges. `roughness: 1` — hand-drawn feel.
- `\n` in `text` creates multi-line labels.
- Types: `rectangle`, `ellipse`, `diamond`, `text` (standalone).
- Zone backgrounds: same as rectangle but add `strokeStyle: "dashed"` and
  `opacity: 30`.

## Arrow Syntax

```json
{
  "type": "arrow",
  "x": 0, "y": 0,
  "startElementId": "api-server",
  "endElementId": "database",
  "strokeColor": "#2f9e44",
  "text": "SQL"
}
```

- `x, y` are approximate — binding to `startElementId`/`endElementId`
  overrides position. The server auto-routes to the nearest edges.
- `startArrowhead` / `endArrowhead`: `"arrow"`, `"dot"`, `"bar"`, or `null`.
- `strokeStyle: "dashed"` — async or optional flows.
- `strokeStyle: "dotted"` — weak dependency.

---

## Colour Quick Reference

Read [references/color-palette.md](references/color-palette.md) for the full
semantic colour table — load it when choosing colours for a new diagram type.

| Role | Fill | Stroke |
|---|---|---|
| Frontend / UI | `#a5d8ff` | `#1971c2` |
| Backend / API | `#d0bfff` | `#7048e8` |
| Database | `#b2f2bb` | `#2f9e44` |
| Queue / Events | `#fff3bf` | `#fab005` |
| External / Third-party | `#ffc9c9` | `#e03131` |
| Zone background | `#e9ecef` + `opacity:30` | `#868e96` dashed |

**Rule:** Same architectural role → same colour pair. Limit diagrams to 3–4
fills. More colours add noise, not clarity.

---

## Anti-Patterns

| Anti-pattern | Why it causes problems |
|---|---|
| Skip screenshot after `clear_canvas` | Ghost elements silently corrupt new arrow bindings |
| Place arrows in a batch before their target shapes | Arrow IDs reference non-existent shapes — no binding |
| Column gap under 100px | Arrow labels bleed into adjacent shapes |
| Arrows without `startElementId`/`endElementId` | Arrow floats, doesn't update when shapes move |
| Skip `set_viewport` after creation | Diagram is off-screen and user sees a blank canvas |
| Zone backgrounds in a separate later batch | Zones render on top of shapes already on the canvas |
| More than 4 fill colours | Diagram becomes unreadable without a legend |
| Creating every element in separate calls | Arrow bindings fail — always batch shapes and their arrows together |

---

## Examples

**"Draw me a 3-tier web architecture"**

1. `read_diagram_guide()` — get colours
2. `clear_canvas()` → `get_canvas_screenshot()` — confirm empty
3. Plan: 3 zones (Frontend y=0, Backend y=360, Data y=720), 2 columns
4. `batch_create_elements([zones..., shapes..., arrows..., titles...])`
5. `get_canvas_screenshot()` — verify
6. `set_viewport({ scrollToContent: true })`

**"Quick flowchart of user login"**

1. `create_from_mermaid("graph TD; A[Enter email] --> B[Verify] --> C[Dashboard]")`
2. `get_canvas_screenshot()` — verify
