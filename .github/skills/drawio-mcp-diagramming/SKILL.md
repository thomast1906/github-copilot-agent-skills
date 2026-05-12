---
name: drawio-mcp-diagramming
description: Create and edit architecture diagrams using Draw.io MCP (`drawio/create_diagram`) with reliable Azure and AWS icon rendering guidance and troubleshooting. Supports Azure2 and AWS4 icon libraries. Requires Python 3 and internet access to refresh icon catalogs (periodic, not per-run).
---

# Draw.io MCP Diagramming Skill

Use this skill to create or update diagrams through the Draw.io MCP tool and to avoid common Azure and AWS icon rendering problems.

See [references/REFERENCE.md](references/REFERENCE.md) for reference artifacts and refresh commands.

For non-Azure/non-AWS diagrams, you can skip icon discovery/validation scripts and proceed directly to `drawio/create_diagram`.

## When to Use

- The user asks to create or refine architecture diagrams (Azure, AWS, or multi-cloud).
- The user wants draw.io/diagrams.net output from an MCP workflow.
- The user needs Azure service icons in diagrams.
- The user needs AWS service icons in diagrams.
- The user reports that Azure or AWS icons/shapes are not appearing.
- The user asks for an **auth or identity flow** (OAuth 2.0, OIDC, JWT validation, SSO, login, token exchange, Entra, Cognito).
- The user asks for an **API or microservice interaction diagram** (request/response chain, service-to-service calls, API gateway flow).
- The user asks for a **CI/CD pipeline or deployment workflow** (build, test, deploy stages, GitHub Actions, Azure DevOps, approval gates).

## Required Tooling

- MCP tool: `drawio/create_diagram`
- Workspace MCP config should include a `drawio` server:

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

## Recommended Workflow

1. **Identify the cloud provider** — determine whether the diagram uses Azure, AWS, or both (multi-cloud).
2. **Verify icon paths from the static catalogs** — no scripts needed at runtime:
   - Azure: grep `references/azure2-complete-catalog.txt`
   - AWS: grep `references/aws4-complete-catalog.txt`
   - Multi-cloud: grep both catalogs as needed.
3. If diagram uses neither Azure nor AWS icons — or is a **sequence or flow diagram** (auth flow, API call chain, CI/CD pipeline): skip icon lookup. For sequence and flow diagrams, apply Sequence and Flow Diagram Patterns (see section below).
4. **For Azure infrastructure/network diagrams**: apply Professional Network Topology Patterns (see Azure section below):
   - Use larger canvas (1900x1500)
   - VNets with thick borders (strokeWidth=4)
   - Subnets with dashed borders (strokeWidth=2, dashPattern=8 8)
   - Position resources inside their subnets
   - Label all traffic flows with protocols/ports
   - Include network isolation explanation box
5. **For AWS infrastructure/network diagrams**: apply AWS Network Topology Patterns (see AWS section below):
   - Use larger canvas (1900x1500) for multi-VPC/account topologies
   - VPCs with thick borders (strokeWidth=4)
   - Subnets (public/private) with dashed borders (strokeWidth=2, dashPattern=8 8)
   - Position resources inside their respective subnets
   - Label all traffic flows with protocols/ports
   - Include security group / NACL notation
6. Build a valid `mxGraphModel` payload using verified icons when applicable.
7. Call `drawio/create_diagram` with the XML.
8. If user wants a file artifact, save as `.drawio` wrapped in `<mxfile><diagram>...</diagram></mxfile>`.
9. Keep labels concise and explicit (service name + role).
10. For cloud-specific diagrams, prefer one icon per major service and use edges for flow semantics (ingress/egress/peering/telemetry).

## Visual Quality Guardrails

Apply these defaults unless the user explicitly asks for a dense/technical view:

- Use 3-4 major lanes/zones max (for example Source, Pipeline, Cloud target).
- Keep primary flow left-to-right with a single main path.
- Use stage numbering (`1`, `2`, `3`, `4`) instead of many edge labels.
- Keep one icon per major service; avoid icon-per-step layouts.
- Limit cross-lane dashed lines to one security/auth line and one optional telemetry line.
- Keep text concise (single purpose per box) and avoid multiline overload.
- **Animated flow on connectors**: adding `flowAnimation=1;` to any edge style renders a moving dot that travels along the arrow, making directional flow immediately visible without extra labels — ideal for data-flow and pipeline diagrams. The animation is preserved in SVG export and the draw.io desktop app. By default, ask the user whether they want any flow arrows animated before generating the diagram — *"Would you like any of the flow arrows animated to show traffic direction? If so, which ones?"* Apply `flowAnimation=1;` only to the edges the user identifies. If the user has already indicated they want a static/clean diagram, skip the question.
- Prefer a "clean" variant first; add detail only if requested.

For worked examples of common layout problems (stacked edges, repeated labels, observability inside VNet, etc.), see [references/layout-antipatterns.md](references/layout-antipatterns.md).

## Professional Network Topology Patterns (Azure Infrastructure)

When creating **Azure infrastructure network diagrams** with VNets, subnets, and network isolation:

### Canvas Sizing
- Use larger canvas for complex infrastructure: `pageWidth="1900" pageHeight="1500"`
- Standard canvas may be too small for multi-VNet topologies

### VNet and Subnet Visualization
- **VNets**: Use thick borders (`strokeWidth=4`) and large containers
  - DMZ VNet: Yellow (`fillColor=#fff2cc`, `strokeColor=#d6b656`)
  - Internal VNet: Green (`fillColor=#d5e8d4`, `strokeColor=#82b366`)
  - Management Zone: Blue (`fillColor=#dae8fc`, `strokeColor=#6c8ebf`)
- **Subnets**: Use dashed borders (`strokeWidth=2`, `dashed=1`, `dashPattern=8 8`)
  - Position subnet containers **inside** VNet containers
  - Use lighter shades of parent VNet color
  - Label with subnet name and CIDR (e.g., "Application Subnet - 10.x.2.0/24")
- **Delegated Subnets**: Add delegation info to label (e.g., "PostgreSQL Subnet - 10.x.4.0/24 (Delegated to Microsoft.DBforPostgreSQL/flexibleServers)")

### Resource Positioning
- Position all resources **inside their respective subnet containers**
- VMs, databases, load balancers must be visually contained within their subnets
- This clearly shows network isolation boundaries

### Traffic Flow Visualization
- **Label all traffic arrows** with protocols and ports, using this colour palette:
  - HTTPS:443 — **Azure blue** (`#0078D4`, thick solid) for internet ingress; prominent but professional
  - HTTP:80/8080/8090/8095 — **Teal** (`#00897B`, solid) for backend pool traffic; signals allowed/healthy east-west flow
  - PostgreSQL:5432 — **Indigo** (`#5C6BC0`, dashed) for database connections; purple/indigo conventionally marks the data tier
  - NFS/Gluster — **Green** (`#43A047`, solid) for shared storage flows
  - RBAC/Identity/SMTP — **Amber** (`#F57C00`, dashed) for management/control-plane traffic
  - Denied/Blocked (WAF, NSG deny rules) — **Red** (`#C62828`) — reserve red exclusively for blocked or denied traffic
- Use `edgeStyle=orthogonalEdgeStyle` for clean routing
- Include `<Array>` waypoints for complex routing
- **Direction animation on key edges**: `flowAnimation=1;` adds a moving dot along a connector arrow, making ingress paths, egress routes, and replication flows readable at a glance — the effect renders in SVG export and draw.io desktop and works on any edge style. Before generating the diagram, ask the user: *"Would you like any of the traffic arrows animated to show flow direction? If so, which ones?"* Apply `flowAnimation=1;` only to the edges they identify. Example style for an animated internet ingress arrow: `style="edgeStyle=orthogonalEdgeStyle;flowAnimation=1;strokeWidth=3;strokeColor=#0078D4;"`

### Essential Components

Include two annotation boxes in every Azure topology diagram:
1. **Network Isolation Explanation** (top-left, `fillColor=#fff9cc`) — visual conventions: VNet thick borders, subnet dashed borders, NSG/DNS notes
2. **Zone Separation** — VNet Peering zone (grey `fillColor=#f5f5f5`) and External Services zone (orange `fillColor=#ffe6cc`)

For a complete example, see [references/topology-patterns.md](references/topology-patterns.md).

### Professional Topology Checklist (Azure)
- [ ] VNets have thick borders (strokeWidth=4)
- [ ] Subnets have dashed borders (strokeWidth=2, dashPattern=8 8)
- [ ] All resources positioned inside their subnets
- [ ] Traffic arrows labelled with protocols and ports using the standard colour palette
- [ ] Network isolation explanation box included
- [ ] Color-coded zones for different purposes
- [ ] Canvas sized appropriately (1900x1500 for complex infra)
- [ ] VNet peering connections shown in separate zone
- [ ] External services grouped in separate zone
- [ ] Animation preference confirmed with user before generating (*"Would you like any flow arrows animated? If so, which ones?"*)

## Professional Network Topology Patterns (AWS Infrastructure)

When creating **AWS infrastructure network diagrams** with VPCs, subnets, and network isolation:

### Canvas Sizing
- Use larger canvas for complex infrastructure: `pageWidth="1900" pageHeight="1500"`
- Standard canvas may be too small for multi-VPC/multi-account topologies

### VPC and Subnet Visualization
- **VPCs**: Use thick borders (`strokeWidth=4`) and large containers
  - Production VPC: Green (`fillColor=#d5e8d4`, `strokeColor=#82b366`)
  - Development VPC: Blue (`fillColor=#dae8fc`, `strokeColor=#6c8ebf`)
  - Shared Services VPC: Yellow (`fillColor=#fff2cc`, `strokeColor=#d6b656`)
- **Subnets**: Use dashed borders (`strokeWidth=2`, `dashed=1`, `dashPattern=8 8`)
  - Public Subnets: Light green (`fillColor=#e6f4ea`, `strokeColor=#82b366`)
  - Private Subnets: Light blue (`fillColor=#EFF7FF`, `strokeColor=#6c8ebf`)
  - Isolated Subnets (databases): Light orange (`fillColor=#fff3e0`, `strokeColor=#e6821e`)
  - Position subnet containers **inside** VPC containers
  - Label with subnet name, AZ, and CIDR (e.g., "Public Subnet A - us-east-1a - 10.x.1.0/24")
- **Availability Zones**: Use light grey container inside VPC to group subnets per AZ

### Resource Positioning
- Position all resources **inside their respective subnet containers**
- EC2 instances, RDS, Lambda, etc. must be visually contained within their subnets
- Internet-facing resources (ALB, NAT Gateway, Bastion) go in **public subnets**
- Application servers / ECS tasks go in **private subnets**
- Databases (RDS, ElastiCache) go in **isolated subnets** with no outbound internet

### Traffic Flow Visualization
- **Label all traffic arrows** with protocols and ports, using the same colour palette as Azure:
  - HTTPS:443 *(internet ingress)* — **Azure blue** (`#0078D4`, thick solid) for external traffic entering via ALB/CloudFront
  - HTTP:80→HTTPS redirect — **Teal** (`#00897B`, solid) for healthy/redirected traffic
  - Port 5432/3306 — **Indigo** (`#5C6BC0`, dashed) for database connections
  - HTTPS:443 *(internal AWS service calls)* — **Green** (`#43A047`, solid) for traffic to VPC Endpoints and AWS-managed services (S3, SSM, Secrets Manager, etc.)
  - SSH:22 / SSM — **Amber** (`#F57C00`, dashed) for management / Bastion access
  - Denied/Blocked (WAF, Security Group deny rules) — **Red** (`#C62828`) — reserve red exclusively for blocked traffic
- Use `edgeStyle=orthogonalEdgeStyle` for clean routing
- Show NAT Gateway path for private subnet → internet egress
- **Direction animation on key edges**: `flowAnimation=1;` adds a moving dot along a connector arrow, making ingress paths, egress routes, and data-transfer flows readable at a glance — the effect renders in SVG export and draw.io desktop and can be applied to any edge style. Before generating the diagram, ask the user: *"Would you like any of the traffic arrows animated to show flow direction? If so, which ones?"* Apply `flowAnimation=1;` only to the edges they identify. Example style for an animated ingress path: `style="edgeStyle=orthogonalEdgeStyle;flowAnimation=1;strokeWidth=3;strokeColor=#0078D4;"`

### Essential Components

Include two annotation boxes in every AWS topology diagram:
1. **Network Isolation Explanation** (top-left) — visual conventions: VPC thick borders, subnet tiers (public/private/isolated), SG/NACL notes, VPC Endpoints
2. **Zone Separation** — Internet/Edge zone (orange), VPC Peering/Transit Gateway zone (grey), AWS Managed Services zone (purple)

For a complete example, see [references/topology-patterns.md](references/topology-patterns.md).

### Professional Topology Checklist (AWS)
- [ ] VPCs have thick borders (strokeWidth=4) and are colour-coded by environment
- [ ] Subnets have dashed borders (strokeWidth=2, dashPattern=8 8) and are colour-coded by tier (public/private/isolated)
- [ ] Availability Zone containers group subnets per AZ
- [ ] All resources positioned inside their respective subnets
- [ ] Internet Gateway and NAT Gateway shown for public/private egress
- [ ] Traffic arrows labelled with protocols and ports using the standard colour palette
- [ ] Security Group boundaries annotated where important
- [ ] Network isolation explanation box included
- [ ] Canvas sized appropriately (1900x1500 for complex infra)
- [ ] VPC Peering / Transit Gateway shown in separate zone
- [ ] Edge/internet services (CloudFront, Route53, WAF) in separate zone
- [ ] Animation preference confirmed with user before generating (*"Would you like any flow arrows animated? If so, which ones?"*)

## Sequence and Flow Diagram Patterns

Use this section for diagrams that show **temporal flows** — what happens in order — rather than infrastructure topology. No cloud icon catalog lookup is required.

### When to Apply

| Diagram type | Keywords | Layout |
|---|---|---|
| Auth / authorisation flow | OAuth, OIDC, JWT, SSO, login, token exchange, Entra, Cognito | Swimlane interaction flow |
| API / microservice call chain | REST, GraphQL, request/response, service-to-service, API gateway | Swimlane or vertical flowchart |
| CI/CD pipeline | pipeline, build, deploy, release, GitHub Actions, Azure DevOps, approval gate | Horizontal pipeline flowchart |

### Layout Approach

**Swimlane interaction flow** (auth / API flows with 2–5 actors):
- Represent each actor as a labelled header rectangle at the top, with a matching full-height light-coloured background column below it
- Steps flow top-to-bottom within each column; number them (`1.`, `2.`, `3.`) in the label so execution order is unambiguous
- All step boxes and edges live at `parent="1"` (root) — no nested swimlane cell geometry required
- Edges cross between columns with `edgeStyle=orthogonalEdgeStyle;`
- Canvas: `pageWidth="1400" pageHeight="900"` for 3 actors; add ~420 px width per additional actor

**Horizontal pipeline flowchart** (CI/CD):
- Stages flow left-to-right: Source → Build → Test → Staging → Approval → Production
- Use `rounded=1` rectangles for stages, `rhombus` shape for gate / decision points
- Colour-code each stage box using the Stage Colours table below
- Failure branch goes downward from the gate with a red edge to a Rollback/Notify step
- Canvas: `pageWidth="1700" pageHeight="600"`

### Colour Conventions

**Edge colours** (consistent with topology palette):

| Meaning | `strokeColor` | Style |
|---|---|---|
| Primary request / call | `#0078D4` Azure blue | solid, `strokeWidth=2` |
| Success response / return | `#00897B` Teal | solid, `strokeWidth=2` |
| Token / credential / redirect | `#F57C00` Amber | `dashed=1`, `strokeWidth=2` |
| Async / event-driven call | `#5C6BC0` Indigo | `dashed=1`, `strokeWidth=2` |
| Error / rejection / rollback | `#C62828` Red | solid, `strokeWidth=2` |
| Optional / conditional | `#666666` Grey | `dashed=1`, `strokeWidth=1` |

**Participant lane colours** (swimlane header + column background at `opacity=30`):

| Actor type | `fillColor` | `strokeColor` |
|---|---|---|
| User / browser / client | `#dae8fc` | `#6c8ebf` |
| Identity provider (Entra, Cognito, Okta) | `#e6f4ea` | `#82b366` |
| API / backend service | `#fff3e0` | `#e6821e` |
| Database / data store | `#f5f5f5` | `#666666` |
| Cloud managed service (Key Vault, S3, etc.) | `#f3e5f5` | `#7B1FA2` |

**Stage fill colours** (CI/CD pipeline):

| Stage | `fillColor` | `fontColor` |
|---|---|---|
| Source / Trigger | `#0078D4` | `#ffffff` |
| Build | `#00897B` | `#ffffff` |
| Test / Quality Gate | `#F57C00` | `#ffffff` |
| Deploy to Staging | `#5C6BC0` | `#ffffff` |
| Approval Gate | `#795548` | `#ffffff` |
| Deploy to Production | `#43A047` | `#ffffff` |
| Rollback / Failure | `#C62828` | `#ffffff` |

### Flow Animation

`flowAnimation=1;` works on sequence/flow edges exactly as in topology diagrams. Apply to primary call paths or pipeline stage transitions. Always ask the user before applying.

### Checklist (Sequence/Flow Diagrams)

- [ ] Diagram type identified (auth flow / API flow / CI/CD pipeline)
- [ ] Actors / participants labelled clearly
- [ ] Steps numbered in execution order
- [ ] Edge colours consistent with conventions above
- [ ] Error / failure paths shown in red
- [ ] Animation preference confirmed with user before generating
- [ ] Canvas sized appropriately for participant count and step depth

## Icon Reference Assets (Azure Diagrams)

This section applies only when the diagram includes Azure services/icons.

1. **Use the static catalog** — `references/azure2-complete-catalog.txt` contains all 648 Azure2 icons.
   - Grep it to find icon paths: `grep -i "gateway" references/azure2-complete-catalog.txt`
   - No HTTP requests or script execution needed at runtime.
2. **Hard gate**
   - If an icon path cannot be confirmed in the catalog, do **not** use it in `drawio/create_diagram`.
   - Find an alternative via grep first.
3. **Render review fallback**
   - If diagram review shows wrong/missing icon rendering, grep the catalog for alternative paths.
   - Substitute and regenerate the diagram.
4. **Refresh catalog** (periodic, human-run — not per diagram):

```bash
cd .github/skills/drawio-mcp-diagramming/scripts
python3 search_azure2_icons_github.py --max-results 9999 > ../references/azure2-complete-catalog.txt
```

## Azure Icon Caveats (Important)

Azure icon rendering in draw.io can fail for two common reasons:

1. **Wrong style type**
   - `shape=mxgraph.azure2.*` may not render in some hosts.
   - Prefer Azure2 image style entries:
   - `image;aspect=fixed;html=1;...;image=img/lib/azure2/<category>/<Icon_Name>.svg;`

2. **Library/environment mismatch**
   - Some embedded viewers/extensions do not resolve `img/lib/azure2/...` consistently.
   - If icons do not render in one host, test in `app.diagrams.net`.

## Icon Reference Assets (AWS Diagrams)

This section applies only when the diagram includes AWS services/icons.

> **Important difference from Azure**: AWS4 icons in draw.io are **stencil-based**, not individual SVG files. They are referenced using `shape=mxgraph.aws4.<name>` rather than `image=img/lib/aws4/...`. The catalog lists ready-to-use style strings in this format.

1. **Use the static catalog** — `references/aws4-complete-catalog.txt` contains all 1,037 AWS4 stencil shape names.
   - Grep it to find shapes: `grep -i "lambda" references/aws4-complete-catalog.txt`
   - Each line is a ready-to-use `shape=mxgraph.aws4.*` style string.
   - No HTTP requests or script execution needed at runtime.
2. **Hard gate**
   - If a shape name cannot be confirmed in the catalog, do **not** use it in `drawio/create_diagram`.
   - Find an alternative via grep first.
3. **Render review fallback**
   - If diagram review shows wrong/missing shape rendering, grep the catalog for alternative names.
   - Substitute and regenerate the diagram.
4. **Refresh catalog** (periodic, human-run — not per diagram):

```bash
cd .github/skills/drawio-mcp-diagramming/scripts
python3 search_aws4_icons_github.py --max-results 9999 > ../references/aws4-complete-catalog.txt
```

## AWS Icon Caveats (Important)

AWS4 icon rendering in draw.io can fail for two common reasons:

1. **Wrong style approach**
   - Do **not** use `image=img/lib/aws4/...` — AWS4 icons are **stencils**, not SVG files.
   - The correct style is: `shape=mxgraph.aws4.<name>;fillColor=#E7157B;fontColor=#ffffff;strokeColor=none;`
   - Fill colour conventions:
     - Compute (orange): `fillColor=#ED7100`
     - Storage (green): `fillColor=#3F8624`
     - Database (blue): `fillColor=#C7131F` (for Aurora/RDS use red)
     - Networking (purple): `fillColor=#8C4FFF`
     - Security (red): `fillColor=#DD344C`
     - Management (orange-red): `fillColor=#E7157B`
     - General/generic: `fillColor=#232F3E` (AWS dark)

2. **Library/environment mismatch**
   - Some embedded viewers may not load the `mxgraph.aws4` stencil library.
   - If shapes do not render in VS Code, test in `app.diagrams.net`.

## How to Discover Icons

Grep the static catalogs — no scripts needed at agent runtime:

```bash
grep -i "gateway" references/azure2-complete-catalog.txt     # Azure
grep -i "lambda"  references/aws4-complete-catalog.txt       # AWS
```

Use verified paths in cell styles:
- **Azure**: `image;aspect=fixed;html=1;points=[];align=center;image=img/lib/azure2/<category>/<Icon_Name>.svg;`
- **AWS**: `shape=mxgraph.aws4.<shape_name>;fillColor=<service_color>;fontColor=#ffffff;strokeColor=none;`

See [references/REFERENCE.md](references/REFERENCE.md) for absolute URL fallback, additional grep examples, and known-good icon style strings.

## Fallback Strategy if Icons Still Fail

If Azure or AWS icons still do not render:

- Do **not** generate the diagram with an unresolved icon set.
- Return the missing icon list and propose verified replacements (grepped from the relevant catalog).
- After replacements validate to `OK`, then generate the diagram.

## Exporting Diagrams

| Format | How | Notes |
|---|---|---|
| **SVG** | `File → Export As → SVG` | Recommended — preserves `flowAnimation` moving-dot effects and all icon rendering. Use for sharing or embedding. |
| **PNG** | `File → Export As → PNG` | Static snapshot. `flowAnimation` effects are not captured; icons and colours are preserved. |
| **PDF** | `File → Export As → PDF` | Best for printed or document-embedded diagrams. Static only. |
| **.drawio file** | `File → Save As` | Preserves all XML, animation settings, and style attributes for future editing. |

> `flowAnimation=1` is only visible when the diagram is open in **draw.io desktop** or rendered as **SVG**. It does not appear in PNG or PDF exports — inform the user of this if they ask why the animation isn't showing.

## Troubleshooting Checklist

- Confirm MCP server appears in `MCP: List Servers`.
- Run `MCP: Reset Cached Tools` if tool list is stale.
- Ensure XML is well-formed (no malformed tags or invalid comments).
- **Azure**: Verify style uses `image=img/lib/azure2/...` for Azure2 icon mode.
- **AWS**: Verify style uses `image=img/lib/aws4/...` for AWS4 icon mode.
- Reopen diagram in web draw.io if VS Code extension rendering differs.
- If an Azure icon path looks wrong, grep `references/azure2-complete-catalog.txt` for alternatives.
- If an AWS icon path looks wrong, grep `references/aws4-complete-catalog.txt` for alternatives.
- If either catalog appears stale, re-run the refresh workflow in REFERENCE.md.

## Prompt Template for Agents

See [references/REFERENCE.md](references/REFERENCE.md) for full example prompt templates.

## Definition of Done

- All icon paths confirmed against the relevant static catalog before calling `drawio/create_diagram`; unconfirmed icons are not used
- Diagram renders correctly; XML is valid and opens in draw.io
- Cloud resources identifiable via correct icons and clear labels
- All applicable topology checklist items passed (borders, subnets, traffic labels, legend, isolation box, zones, canvas size)
- All applicable sequence/flow checklist items passed (numbered steps, colour-coded edges, error paths, canvas size)
- Animation preference confirmed; `flowAnimation=1;` applied only to user-identified edges
- File artifact saved as `.drawio` (wrapped in `<mxfile>`) if requested
- Layout anti-patterns checked against [references/layout-antipatterns.md](references/layout-antipatterns.md) before finalising