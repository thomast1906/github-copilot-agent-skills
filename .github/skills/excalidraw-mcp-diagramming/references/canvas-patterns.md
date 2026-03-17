# Canvas Layout Patterns

Load during Step 4 (Plan the Layout) when you need coordinate templates or are
deciding which layout pattern to use. Each pattern includes validated starting
coordinates for standard box size `230×160` with `roughness: 0`.

---

## Pattern Selection

| Situation | Use |
|---|---|
| Layered system (UI → API → DB), CI/CD pipeline, sequential request flow | Vertical Flow |
| ETL/data processing, transformation chain, left-to-right pipeline | Horizontal Pipeline |
| Event bus, message broker, single source fan-out | Hub and Spoke |
| Tracing a request or parameter through layers with data transformations | Data Flow Trace |
| Concept hierarchy, system component breakdown | Tree (lines + text) |

---

## 1. Vertical Flow

**Best for:** Layered architectures, multi-tier systems, anything where data
moves top-to-bottom through distinct responsibility layers.

```
Title (y = -50, standalone text)

[Zone 1 background: x=0, y=0, height=260]
  [Box A: x=40, y=50]    [Box B: x=480, y=50]    [Box C: x=920, y=50]

[Zone 2 background: x=0, y=350, height=260]
  [Box D: x=40, y=400]   [Box E: x=480, y=400]

[Zone 3 background: x=0, y=700, height=260]
  [Box F: x=240, y=750]
```

**Spacing rules:**
- Column pitch (labeled arrows): **440px** — box 230 + gap 210
- Column pitch (unlabeled arrows): **360px** — box 230 + gap 130
- Row pitch: **350px** — box 160 + gap 190
- Starting columns: x = 40, 480, 920
- Zone background: y = row_y − 50, height = box_height + 100
- Zone width: covers all columns + 60px right padding

**Arrow style:** Vertical arrows pointing downward. Cross-zone arrows use
`strokeStyle: "dashed"`.

---

## 2. Horizontal Pipeline

**Best for:** Data processing stages where input enters from the left and
output exits to the right. ETL flows, transformation chains, streaming
pipelines.

```
[Source: x=40] ──► [Transform 1: x=480] ──► [Transform 2: x=920] ──► [Output: x=1360]
All boxes at same y=200
```

**Spacing rules:**
- Column pitch: 440px (laborded arrows) or 360px (unlabeled)
- All boxes at the same `y` — do not vary row height in this pattern
- Annotations and side notes: place at y ± 200 (above or below the pipeline)
- Stage labels: standalone text at y = main_y + box_height + 30

**Arrow style:** Horizontal, left to right. Arrow `text` label appears at
midpoint. Keep labels short (< 15 chars) or they clip in narrow gaps.

---

## 3. Hub and Spoke

**Best for:** Event buses, message brokers, API gateways that fan out to
multiple consumers. Any pattern where one central component connects to many
peers.

```
                    [Consumer A: x=540, y=40]
                            ▲
                            │
[Producer: x=40, y=300] ──► [Hub: x=380, y=300] ──► [Consumer B: x=720, y=300]
                            │
                            ▼
                    [Consumer C: x=540, y=560]
```

**Coordinates:**
- Hub centre: x=380, y=300
- Consumer A (top):  x = hub_x + (hub_width/2) − 115, y = hub_y − 260
- Consumer C (bottom): same x, y = hub_y + 260
- Consumer B (right): x = hub_x + hub_width + 80, same y
- Producer (left): x = hub_x − producer_width − 80, same y

**Arrow style:** Radiate from hub edges. Use distinct `strokeColor` per
consumer type to distinguish channels/topics. Label arrows with the event
name or topic.

---

## 4. Data Flow Trace

**Best for:** Tracing a single parameter, request, or data object through
architectural layers — showing how form changes at each boundary.

Three-column structure:

```
x ≤ -50        x: 60–360            x: 570+
Layer labels   Centre flow column   Data form annotations
(gray, sm)     (colored boxes)      (orange, sm)
```

**Coordinates (validated for 5-layer trace):**

| Element | x | y per row | width | height |
|---|---|---|---|---|
| Centre flow box | 60 | base + (row × 150) | 300 | 65 |
| Split left box | −100 | split_row_y | 290 | 65 |
| Split right box | 230 | split_row_y | 290 | 65 |
| Decision diamond | 110 | decision_y | 200 | 120 |
| Layer label (text) | −200 | aligned to box y | — | fontSize 14 |
| Data form annotation (text) | 570 | aligned to box y | — | fontSize 14 |
| WHY context box | 460 | 80 | 440 | 310 |

**Colour by layer role:**
- Blue (`#a5d8ff`/`#1971c2`): user-facing API layers
- Purple (`#eebefa`/`#9c36b5`): internal processing layers
- Green (`#b2f2bb`/`#2f9e44`): execution layer / success outcomes
- Yellow (`#fff3bf`/`#fab005`): decision nodes
- Red (`#ffc9c9`/`#e03131`): expensive or error paths

**WHY context box** (optional, recommended for technical explanations):
Place a grey-background rectangle at x=460, y=80 containing 3–4 text items:
- Problem description (red stroke `#e03131`)
- Why it is expensive or wrong (red stroke)
- Current gap (neutral)
- Solution (green stroke `#2f9e44`)

---

## 5. Tree (Hierarchy)

**Best for:** File system structures, org charts, concept taxonomies. Uses
lines and free-floating text rather than boxes — this keeps it clean.

```
Root label (center top)
    │
    ├── Branch A label
    │       ├── Leaf A1 label
    │       └── Leaf A2 label
    └── Branch B label
            └── Leaf B1 label
```

**Implementation:**
- Use `type: "line"` elements for the trunk and branch connectors.
- Place `type: "text"` elements (no container) beside each node.
- Do not use rectangles — the tree structure reads cleaner without boxes.
- Font size: 16px for branches, 14px for leaves.

---

## Sizing Rules (Summary)

| Dimension | Value | Notes |
|---|---|---|
| Standard box width | 230px | Fits 2-line labels with breathing room |
| Standard box height | 160px | Fits 3–4 line label comfortably |
| Labeled arrow gap | ≥150px | Arrow label needs clearance on both sides |
| Unlabeled arrow gap | ≥100px | Minimum for visual separation |
| Column pitch (labeled) | 440px | 230 box + 210 gap |
| Column pitch (unlabeled) | 360px | 230 box + 130 gap |
| Row pitch | 350px | 160 box + 190 gap |
| Zone padding | 50px around children | Zone borders must not hug inner boxes |
| Zone opacity | 25–40 | Background only — not a foreground element |
| Title font size | 24px | |
| Zone label font size | 14px | Subtle — does not compete with content |
| roughness | 0 | Professional. Use 1 for informal/brainstorm |

**Err on the side of more space.** Diagrams that feel "too spread out" when
planning almost always look right on screen. Tight diagrams hide arrow labels
and look cluttered in screenshots.
