# XML Authoring Rules for draw.io MCP

Hard constraints and edge-routing best practices for writing `mxGraphModel` XML that renders correctly in the draw.io MCP server (both App Server and Tool Server variants).

---

## Hard Constraints

Violating any of these causes render errors or silent failures from the MCP server.

| Constraint | Detail |
|---|---|
| **No XML comments** | `<!-- ... -->` anywhere in the XML causes the server to reject the payload with an explicit error. Remove all comments before submitting. |
| **Unique `id` values** | Every `mxCell` must have a globally unique `id` within the document. Duplicate IDs cause unpredictable rendering. |
| **Valid edge references** | Edge cells must use `edge="1"` and reference `source` and `target` IDs that exist in the same document. |
| **No unescaped XML characters in styles** | Style strings must not contain raw `<`, `>`, or `&`. Use `&lt;`, `&gt;`, `&amp;` if needed. |
| **Edges need an expanded geometry child** | Every edge `mxCell` must contain `<mxGeometry relative="1" as="geometry"/>`. A self-closing edge cell does not render. |
| **`html=1` required for HTML labels** | Cell `value` attributes that use `<b>`, `<br>`, `<i>`, or any HTML tag must have `html=1` in the cell style. Without it the tags render as literal text. Newlines using `&#xa;` work without `html=1`. |

---

## Containers: Nest Hierarchy, Do Not Stack Rectangles

Any diagram with nested groupings — VNet → Subnet → resource, VPC → AZ → instance, Datacenter → Rack → Server, Region → Environment → Service — must use real parent-child containment. Drawing a large rectangle and positioning shapes on top of it at absolute coordinates *looks* right in a static render but breaks move, resize, collapse, and every layout pass, and it is the single most common structural failure in generated diagrams.

**Rules:**

- Every container level is a `swimlane` with `startSize=24` (title area at the top). Add `container=1;pointerEvents=0;` when using a non-swimlane shape as a container so it does not capture connections from its children.
- Child cells set `parent="<container_id>"` and use coordinates **relative to their parent** — origin `0,0` is the parent's top-left, so leave `y >= startSize` to clear the title.
- Edges between cells in **different** containers must have `parent="1"`. Parented to a container, they render inside it and get clipped.
- Edges crossing a container boundary to reach a child are normal and expected — do not add waypoints to route around the parent.
- Icons from `search_shapes` are ordinary vertices: substitute the returned `style` and keep the container structure unchanged.

```xml
<mxCell id="vnet" value="Internal VNet - 10.0.0.0/16" style="swimlane;startSize=24;html=1;fillColor=#d5e8d4;strokeColor=#82b366;strokeWidth=4;fontStyle=1;" vertex="1" parent="1">
  <mxGeometry x="240" y="120" width="720" height="360" as="geometry"/>
</mxCell>
<mxCell id="snet-app" value="Application Subnet - 10.0.2.0/24" style="swimlane;startSize=24;html=1;fillColor=#e6f4ea;strokeColor=#82b366;strokeWidth=2;dashed=1;dashPattern=8 8;" vertex="1" parent="vnet">
  <mxGeometry x="20" y="40" width="320" height="280" as="geometry"/>
</mxCell>
<mxCell id="vm" value="App VM" style="image;aspect=fixed;html=1;points=[];align=center;verticalLabelPosition=bottom;verticalAlign=top;image=img/lib/azure2/compute/Virtual_Machine.svg;" vertex="1" parent="snet-app">
  <mxGeometry x="40" y="50" width="64" height="59" as="geometry"/>
</mxCell>
<mxCell id="e-lb-vm" value="HTTPS:443" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#0078D4;strokeWidth=2;" edge="1" parent="1" source="lb" target="vm">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

---

## Z-Order (Only for Siblings at `parent="1"`)

Cells defined later render on top of earlier siblings. When background rectangles and icons are siblings at `parent="1"`, define the backgrounds first or they will cover the icons. Real containers make this moot — a child always renders above its parent — which is another reason to prefer containment over stacked rectangles.

---

## Icon Size Normalisation

`drawio/search_shapes` returns varying default dimensions (e.g. 65×60, 68×68, 64×64). Use these default sizes as returned — they reflect the icon's intended aspect ratio. When normalising a row of icons for visual consistency, 64×64 is a common safe size. Never scale an icon that has `aspect=fixed` in its style to a size that changes the aspect ratio.

---

## Do Not Hand-Route Edges

Declare `source` and `target`, pick an edge style, and stop there. The `create_diagram` XML reference is explicit: do **not** add `<Array as="points">` waypoints and do **not** set `exitX`/`exitY`/`entryX`/`entryY`. When a layout pass runs it computes those values, and hand-written ones fight it; when no pass runs, draw.io's own router handles the path.

Decide the pass **before** writing XML:

| Situation | Pass |
|---|---|
| Hand-placed layout — architecture, topology, deployment, swimlanes, containers, UML | `routing: "libavoid"` (keeps positions, routes wires around shapes) |
| Directional/hierarchical XML — pipelines, decision flows, state machines | `postLayout: "elk"`, plus `direction: "horizontal"` for left-to-right flow |
| Sparse layout with clear space between connected nodes | Neither — the basic router is fine |

Never set both: ELK already routes its own edges. Use `edgeStyle=orthogonalEdgeStyle` consistently within a diagram, and express meaning through `strokeColor`, `dashed=1`, `strokeWidth`, and the edge label.

### Baseline edge style

Always include `orthogonalLoop=1;jettySize=auto;` alongside `edgeStyle=orthogonalEdgeStyle;rounded=1;`. Without them, self-loops render as straight lines through their own shape, and endpoints on curved shapes snap to the wrong face.

```xml
style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;"
```

`orthogonalLoop=1` forces loop edges out and back on orthogonal paths. `jettySize=auto` lets draw.io pick the connector stub length that keeps the arrowhead clear of the shape boundary — the default fixed value clips arrowheads on narrow shapes.

---

## Node Spacing and Routing Corridors

How you place nodes determines whether edges can route cleanly — and no router fixes a layout where shapes block the only viable path.

**Leave clear corridors between rows and columns.** A corridor is the empty horizontal or vertical band between two rows (or columns) of nodes where edges must travel. If a shape sits in that band, the router must detour around it, often producing a crossing or a long detour that looks wrong. Size corridors to the diagram's density:

| Diagram complexity | Node count | Minimum corridor |
|---|---|---|
| Simple | ≤ 5 nodes | 120 px |
| Medium | 6–12 nodes | 160 px |
| Complex / infrastructure | 13+ nodes | 200 px |

**How to apply this in practice:**

1. Assign nodes to horizontal bands (tiers) before computing `x`/`y` values. Nodes in the same tier share a `y` range; the gap to the next tier is the corridor.
2. Never place a node in the vertical or horizontal gap that an edge from a different tier must cross. If a node would land in a corridor, move it into an existing tier or create a new one.
3. Hub nodes — those with the most connections — belong at the centre of their tier so edges radiate outward rather than crossing each other to reach the hub.
4. These rules apply to hand-placed XML. When using `postLayout: "elk"` or `routing: "libavoid"`, the layout/routing pass sets its own spacing — do not fight it with tight manual coordinates.

**Snap to a grid.** Set all `x`, `y`, `width`, `height` to multiples of 10. It makes manual edits predictable and keeps shapes aligned on draw.io's default grid.

---

## Edge Density Rules

Overlapping arrows are the most common visual quality problem in generated diagrams, and the fix is fewer edges — not more routing hints. Apply these before writing any edge XML.

### Edge count limits

| Situation | Rule |
|---|---|
| A node is the source of 3+ edges going to **different zones** | Assign a distinct `exitX`/`exitY` to each edge. Never let all edges leave from the same connection point. |
| Fan-out to multiple **same-tier targets** (e.g. API gateway → 3 backends, same protocol) | Use **one aggregated edge** labelled e.g. `"HTTP:80 → backends"` instead of 3 identical arrows. |
| Observability (diagnostic logs from multiple services to Log Analytics / CloudWatch) | Draw **one representative edge** from the most significant source, labelled `"Diagnostic settings (all services)"`. Max 2 observability edges in any diagram. |
| Security / identity pattern (Managed Identity → Key Vault, or IAM Role → Secrets Manager, from multiple services) | Draw **one amber dashed edge** from the primary service. Not one per service instance. |

### The narrow exceptions

There are two cases where a manual override is justified. Both are rare, and both should be a deliberate answer to a problem you have already seen in a rendered diagram — never a precaution applied up front.

**1. A node with 3+ edges where the source face carries meaning.** For example a firewall whose inbound edges must enter the north face and outbound edges must leave the south face. Set only the endpoints that carry that meaning, and leave everything else to the router:

| Face | Style fragment |
|---|---|
| Left centre | `exitX=0;exitY=0.5;exitDx=0;exitDy=0;` |
| Right centre | `exitX=1;exitY=0.5;exitDx=0;exitDy=0;` |
| Top centre | `exitX=0.5;exitY=0;exitDx=0;exitDy=0;` |
| Bottom centre | `exitX=0.5;exitY=1;exitDx=0;exitDy=0;` |

```xml
<mxCell id="e-fw-out" value="Egress" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#00897B;strokeWidth=2;exitX=0.5;exitY=1;exitDx=0;exitDy=0;" edge="1" parent="1" source="fw" target="nat">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

**2. A fixed, hand-placed diagram the user is iterating on by coordinate**, where a single bend point resolves a genuinely ambiguous critical path *and* a routing pass has already been tried and rejected. Add one `<Array>` waypoint, no more:

```xml
<mxCell id="e-apim-kv" value="HTTPS:443 (Managed Identity)" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#F57C00;strokeWidth=2;dashed=1;" edge="1" parent="1" source="apim" target="keyvault">
  <mxGeometry relative="1" as="geometry">
    <Array as="points">
      <mxPoint x="622" y="990"/>
    </Array>
  </mxGeometry>
</mxCell>
```

Note that `<mxGeometry>` must be written as an open/close pair when it has children — a self-closing tag with an `<Array>` inside is invalid.

If neither exception applies, delete the override and re-run with `routing: "libavoid"`.

### Pre-generation edge checklist

Run this check before writing edge XML for any infrastructure diagram:

- [ ] Layout pass decided up front (`routing: "libavoid"`, or `postLayout: "elk"` with `direction` — never both)
- [ ] No hand-written `exitX`/`exitY`/`entryX`/`entryY` or `<Array as="points">` unless one of the two documented exceptions applies
- [ ] Count edges per source node — consolidate duplicate fan-outs before adding extra arrows
- [ ] Fan-out patterns (same edge type, multiple same-tier targets) consolidated to one labelled edge
- [ ] No two edges share the same label leaving the same source node
- [ ] Observability telemetry: <= 2 edges total across the whole diagram
- [ ] Security/identity pattern: <= 1 amber dashed edge per service tier
- [ ] Cross-container edges declared at `parent="1"`
- [ ] Every edge cell has an expanded `<mxGeometry relative="1" as="geometry"/>` child
- [ ] Every edge style includes `orthogonalLoop=1;jettySize=auto;`
- [ ] Nodes assigned to tiers with corridor gaps sized to diagram complexity (120 / 160 / 200 px)
