# Iterative Refinement

Load this file when the user asks to **change, fix, update, or extend** an
existing diagram. The canvas persists between calls — you are editing a live
scene, not regenerating from scratch.

---

## Decision Tree

```
User asks to change something
        │
        ├─ "Change the label / colour / position of X"
        │       └─► update_element  (fastest, no binding risk)
        │
        ├─ "Make X bigger / change it to a diamond / resize it"
        │       └─► delete X + redraw X (with any bound arrows)
        │               in one batch_create_elements call
        │
        ├─ "Add a new component between A and B"
        │       └─► delete arrow A→B + create new shape +
        │               create arrow A→new + create arrow new→B
        │               in one batch_create_elements call
        │
        └─ "Restructure a whole zone / section"
                └─► delete zone bg + all shapes + all arrows in zone
                        then redraw everything in one batch
```

---

## Step 1 — Audit the Canvas

Always start by auditing the current state. You need real element `id` values
— do not guess from earlier calls (IDs may have changed if the diagram was
partially rebuilt).

```
describe_scene()
```

Returns: list of all elements with `id`, `type`, `label/text`, `x`, `y`,
`width`, `height`. Note down the IDs of elements you intend to modify.

---

## Step 2 — Choose the Edit Method

### `update_element` — for attribute changes only

Use when the shape itself stays the same and you are only changing:
- `text` / label content
- `backgroundColor` / `strokeColor`
- `opacity`
- `x` / `y` position
- `fontSize` on a label
- `strokeStyle` (solid → dashed)

```
update_element({ id: "api-box", text: "API Gateway\nv2" })
update_element({ id: "api-box", backgroundColor: "#b2f2bb", strokeColor: "#2f9e44" })
update_element({ id: "api-box", x: 500, y: 200 })
```

**Limitation:** `update_element` cannot change shape type, width/height, or
re-bind arrows. If you need any of those, delete and redraw.

---

### `delete` + `batch_create_elements` — for structural changes

Use when:
- Shape type must change (rectangle → diamond)
- Width or height must change
- Arrow endpoint must move to a different shape
- Multiple connected elements must change together

**Critical:** When you delete a shape, all arrows bound to it lose their
binding. If those arrows still need to exist, you must delete them too and
recreate them in the same batch as the new shape.

```json
batch_create_elements([
  { "type": "delete", "ids": "old-shape-id,arrow-to-old,arrow-from-old" },
  { "type": "rectangle", "id": "new-shape-id", ... },
  { "type": "arrow", "id": "new-arrow-1", "startElementId": "upstream-box",
    "endElementId": "new-shape-id", ... },
  { "type": "arrow", "id": "new-arrow-2", "startElementId": "new-shape-id",
    "endElementId": "downstream-box", ... }
])
```

**Rule:** Delete IDs and replacement elements must be in **the same batch**.
Never delete in one call and recreate in a second call — arrow bindings won't
resolve.

---

## Step 3 — Screenshot and Verify

After every edit (update or redraw), take a screenshot:

```
get_canvas_screenshot()
```

Check:
- Did the correct element change?
- Are arrow bindings still intact (arrows connect to shapes, not floating)?
- Did any adjacent elements shift unexpectedly?
- Are labels still readable and unclipped?

---

## Step 4 — Re-zoom if the Layout Changed

If shapes moved or the diagram grew, re-fit the viewport:

```
set_viewport({ scrollToContent: true })
```

---

## Common Scenarios

### Rename a shape label

```
describe_scene()  →  find id "box-api"
update_element({ id: "box-api", text: "API Gateway\nAzure APIM" })
get_canvas_screenshot()
```

### Change a shape's colour to match a new role

```
update_element({ id: "cache-box", backgroundColor: "#ffe8cc", strokeColor: "#fd7e14" })
```

### Insert a new component into an existing flow

```
describe_scene()  →  note ids: "frontend", "backend", "arrow-fe-be"

batch_create_elements([
  { "type": "delete", "ids": "arrow-fe-be" },
  { "type": "rectangle", "id": "gateway", "x": ..., ... },
  { "type": "arrow", "id": "arr-fe-gw", "startElementId": "frontend",
    "endElementId": "gateway", ... },
  { "type": "arrow", "id": "arr-gw-be", "startElementId": "gateway",
    "endElementId": "backend", ... }
])

get_canvas_screenshot()
```

### Change a decision node from rectangle to diamond

```
describe_scene()  →  note ids: "gate-box", "arr-in", "arr-yes", "arr-no"

batch_create_elements([
  { "type": "delete", "ids": "gate-box,arr-in,arr-yes,arr-no" },
  { "type": "diamond", "id": "gate-box-new", "x": ..., "y": ...,
    "width": 200, "height": 120, "label": { "text": "Approved?" } },
  { "type": "arrow", "id": "arr-in-new",  "startElementId": "prev-step",
    "endElementId": "gate-box-new", ... },
  { "type": "arrow", "id": "arr-yes-new", "startElementId": "gate-box-new",
    "endElementId": "next-step", "label": { "text": "Yes" }, ... },
  { "type": "arrow", "id": "arr-no-new",  "startElementId": "gate-box-new",
    "endElementId": "reject-step", "label": { "text": "No" },
    "strokeStyle": "dashed", ... }
])

get_canvas_screenshot()
```

---

## What NOT to Do

| Don't | Why |
|---|---|
| Guess element IDs from memory | IDs from previous sessions may be stale — always `describe_scene()` first |
| Delete a shape in one call, recreate in the next | Arrow bindings won't resolve across separate calls |
| Use `update_element` to change shape dimensions | `width`/`height` are not patchable — delete and redraw |
| Redraw the entire diagram to fix one shape | Unnecessary churn; use targeted delete + redraw for the affected subgraph only |
| Skip the post-edit screenshot | Small edits often have unintended side effects on adjacent elements |
