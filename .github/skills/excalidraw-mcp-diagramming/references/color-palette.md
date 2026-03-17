# Colour Palette

Load during Step 2 alongside `read_diagram_guide()` when choosing colours for
a new diagram. The server guide takes precedence if values differ — this file
provides semantic guidance on when to use each colour, which the server guide
does not.

---

## Component Colours

Each row is a fill/stroke pair. Always use them together — a `#d0bfff` fill
with a `#1971c2` stroke produces an inconsistent visual that breaks the
semantic encoding.

| Role | Fill | Stroke | Typical examples |
|---|---|---|---|
| Frontend / UI | `#a5d8ff` | `#1971c2` | React, Next.js, browser apps, mobile clients |
| Backend / API | `#d0bfff` | `#7048e8` | REST API servers, GraphQL, gRPC services |
| Database | `#b2f2bb` | `#2f9e44` | PostgreSQL, MySQL, MongoDB, DynamoDB |
| Storage | `#ffec99` | `#f08c00` | S3, blob storage, file systems, NFS |
| AI / ML | `#e599f7` | `#9c36b5` | ML models, AI services, inference endpoints |
| External / Third-party | `#ffc9c9` | `#e03131` | SaaS integrations, payment APIs, OAuth providers |
| Queue / Events | `#fff3bf` | `#fab005` | Kafka, SQS, RabbitMQ, event streams |
| Cache | `#ffe8cc` | `#fd7e14` | Redis, Memcached, CDN edge nodes |
| Decision / Gate | `#ffd8a8` | `#e8590c` | Conditional routers, circuit breakers, feature flags |
| Zone / Group background | `#e9ecef` | `#868e96` | Logical zones (add `opacity: 30`, `strokeStyle: "dashed"`) |

**Per-diagram limit:** Maximum 4 distinct fill colours. If you need more, your
diagram has too many roles — split into multiple diagrams or generalise roles.

---

## Arrow Colours

Where possible, match the arrow colour to the stroke of the component it
originates from. Where the arrow crosses role boundaries, use the semantic
conventions below.

| Flow type | Colour | strokeStyle |
|---|---|---|
| Primary synchronous | Source component stroke colour | solid |
| Async / event-driven | `#fab005` | dashed |
| Optional or fallback | `#868e96` | dashed |
| Weak dependency / informational | `#868e96` | dotted |
| Error / failure path | `#e03131` | solid or dashed |
| Success / happy path | `#2f9e44` | solid |
| Auth / identity flow | `#fd7e14` | dashed |

---

## Typography Colours (Standalone Text Elements)

Standalone `type: "text"` elements — zone labels, titles, annotations — use
these `strokeColor` values (for text, this property controls the text colour).

| Purpose | strokeColor | fontSize | Notes |
|---|---|---|---|
| Diagram title | `#1e1e1e` | 24 | Main heading, above diagram |
| Zone / section heading | `#868e96` | 14 | Inside or above zone background |
| Layer label (data flow) | `#868e96` | 14 | Left column, data flow traces |
| Data form annotation | `#e8590c` | 14 | Right column, data flow traces |
| WHY box — problem | `#e03131` | 16 | Red signals the problem |
| WHY box — solution | `#2f9e44` | 16 | Green signals the fix |
| Inline annotation / note | `#495057` | 14 | Supplementary context |

---

## Design Rules

**Same role = same colour pair.** If two boxes both represent API servers,
they get the same fill and stroke. Mixing colours for the same role implies a
distinction that doesn't exist and confuses readers.

**Zone backgrounds are backgrounds.** They must have `opacity: 25–40` and
`strokeStyle: "dashed"`. A fully opaque zone overlays its children.

**Limit to 3–4 fills per diagram.** More than 4 fills require a legend,
which adds cognitive overhead. If you find yourself using 6 colours, you
have too many roles in one diagram.

**Colour encodes role, not importance.** Do not use colour to highlight
"important" components — use size and whitespace for visual hierarchy.
