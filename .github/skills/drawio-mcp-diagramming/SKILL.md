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
3. If diagram uses neither Azure nor AWS icons: skip icon lookup and create diagram directly.
4. **For Azure infrastructure/network diagrams**: apply Professional Network Topology Patterns (see Azure section below):
   - Use larger canvas (1900x1500)
   - VNets with thick borders (strokeWidth=4)
   - Subnets with dashed borders (strokeWidth=2, dashPattern=8 8)
   - Position resources inside their subnets
   - Label all traffic flows with protocols/ports
   - Include traffic legend and network isolation explanation boxes
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
- **Label all traffic arrows** with protocols and ports:
  - HTTPS:443 (red thick arrows for internet ingress)
  - HTTP:8080/8090/8095 (gold arrows for backend pools)
  - PostgreSQL:5432 (blue dashed arrows for database connections)
  - NFS/Gluster (green arrows for shared storage)
  - RBAC/Identity/SMTP (orange dashed arrows for management/external)
- Use `edgeStyle=orthogonalEdgeStyle` for clean routing
- Include `<Array>` waypoints for complex routing

### Essential Components
1. **Traffic Legend Box** (bottom-left)
   - Show all 5 traffic types with color-coded arrows
   - Include protocol/port information
   - Use thick bordered white box (`strokeWidth=3`)

2. **Network Isolation Explanation Box** (top-left)
   - Explain visual conventions:
     - "VNets: Thick borders"
     - "Subnets: Dashed borders"
     - "PostgreSQL subnet delegated"
     - "NSGs control traffic"
     - "Private DNS for internal resolution"
   - Use yellow background (`fillColor=#fff9cc`)

3. **Zone Separation**
   - VNet Peering Zone: Grey box (`fillColor=#f5f5f5`, `strokeColor=#666666`)
   - External Services Zone: Orange box (`fillColor=#ffe6cc`, `strokeColor=#d79b00`)

### Complete Example Structure
```xml
<mxGraphModel pageWidth="1900" pageHeight="1500">
  <!-- VNet Container with thick border -->
  <mxCell id="vnet" value="Internal VNet - 10.x.0.0/16" 
    style="rounded=0;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;
    verticalAlign=top;fontSize=16;fontStyle=1;align=center;strokeWidth=4;">
    <mxGeometry x="220" y="580" width="1340" height="820"/>
  </mxCell>
  
  <!-- Subnet Container with dashed border inside VNet -->
  <mxCell id="subnet-app" value="Application Subnet - 10.x.2.0/24"
    style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e6f4ea;strokeColor=#82b366;
    verticalAlign=top;fontSize=13;fontStyle=1;align=center;strokeWidth=2;dashed=1;dashPattern=8 8;">
    <mxGeometry x="260" y="650" width="480" height="340"/>
  </mxCell>
  
  <!-- Resources inside subnet -->
  <mxCell id="vm" style="image;aspect=fixed;html=1;points=[];align=center;
    image=img/lib/azure2/compute/Virtual_Machine.svg;">
    <mxGeometry x="300" y="720" width="64" height="59"/>
  </mxCell>
  
  <!-- Labeled traffic edge -->
  <mxCell id="edge" value="PostgreSQL:5432" 
    style="edgeStyle=orthogonalEdgeStyle;strokeWidth=2;strokeColor=#6c8ebf;dashed=1;"
    edge="1" source="vm" target="postgres">
    <mxGeometry relative="1"/>
  </mxCell>
</mxGraphModel>
```

### Professional Topology Checklist (Azure)
- [ ] VNets have thick borders (strokeWidth=4)
- [ ] Subnets have dashed borders (strokeWidth=2, dashPattern=8 8)
- [ ] All resources positioned inside their subnets
- [ ] Traffic arrows labeled with protocols and ports
- [ ] Traffic legend box included
- [ ] Network isolation explanation box included
- [ ] Color-coded zones for different purposes
- [ ] Canvas sized appropriately (1900x1500 for complex infra)
- [ ] VNet peering connections shown in separate zone
- [ ] External services grouped in separate zone

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
- **Label all traffic arrows** with protocols/ports:
  - HTTPS:443 (red thick arrows for internet ingress via ALB/CloudFront)
  - HTTP:80→HTTPS redirect (light red)
  - Port 5432/3306 (blue dashed arrows for DB connections)
  - HTTPS:443 (green arrows for VPC Endpoints / AWS service calls)
  - SSH:22 / SSM (orange dashed for management / Bastion access)
- Use `edgeStyle=orthogonalEdgeStyle` for clean routing
- Show NAT Gateway path for private subnet → internet egress

### Essential Components
1. **Traffic Legend Box** (bottom-left)
   - Show all traffic types with colour-coded arrows
   - Include protocol/port information

2. **Network Isolation Explanation Box** (top-left)
   - Explain visual conventions:
     - "VPCs: Thick borders"
     - "Subnets: Dashed borders (Public/Private/Isolated)"
     - "Security Groups control ingress/egress per resource"
     - "NACLs control subnet-level traffic"
     - "VPC Endpoints for private AWS service access"

3. **Zone Separation**
   - Internet/Edge Zone: Orange box for CloudFront, Route53, WAF, Shield
   - VPC Peering / Transit Gateway Zone: Grey box
   - AWS Managed Services Zone: Purple box for S3, DynamoDB VPC endpoints, etc.

### Complete Example Structure
```xml
<mxGraphModel pageWidth="1900" pageHeight="1500">
  <!-- VPC Container with thick border -->
  <mxCell id="vpc" value="Production VPC - 10.x.0.0/16"
    style="rounded=0;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;
    verticalAlign=top;fontSize=16;fontStyle=1;align=center;strokeWidth=4;">
    <mxGeometry x="220" y="200" width="1340" height="1100"/>
  </mxCell>

  <!-- AZ Container inside VPC -->
  <mxCell id="az-a" value="us-east-1a"
    style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;
    verticalAlign=top;fontSize=13;align=center;strokeWidth=1;dashed=1;">
    <mxGeometry x="260" y="280" width="600" height="960"/>
  </mxCell>

  <!-- Public Subnet inside AZ -->
  <mxCell id="subnet-public-a" value="Public Subnet A - 10.x.1.0/24"
    style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e6f4ea;strokeColor=#82b366;
    verticalAlign=top;fontSize=12;fontStyle=1;align=center;strokeWidth=2;dashed=1;dashPattern=8 8;">
    <mxGeometry x="280" y="360" width="550" height="200"/>
  </mxCell>

  <!-- ALB stencil shape inside subnet -->
  <mxCell id="alb" value="ALB"
    style="shape=mxgraph.aws4.application_load_balancer;fillColor=#8C4FFF;
    fontColor=#ffffff;strokeColor=none;align=center;html=1;">
    <mxGeometry x="320" y="410" width="64" height="64"/>
  </mxCell>

  <!-- Labeled traffic edge -->
  <mxCell id="edge-rds" value="PostgreSQL:5432"
    style="edgeStyle=orthogonalEdgeStyle;strokeWidth=2;strokeColor=#6c8ebf;dashed=1;"
    edge="1" source="alb" target="rds">
    <mxGeometry relative="1"/>
  </mxCell>
</mxGraphModel>
```

### Professional Topology Checklist (AWS)
- [ ] VPCs have thick borders (strokeWidth=4) and are colour-coded by environment
- [ ] Subnets have dashed borders (strokeWidth=2, dashPattern=8 8) and are colour-coded by tier (public/private/isolated)
- [ ] Availability Zone containers group subnets per AZ
- [ ] All resources positioned inside their respective subnets
- [ ] Internet Gateway and NAT Gateway shown for public/private egress
- [ ] Traffic arrows labeled with protocols and ports
- [ ] Security Group boundaries annotated where important
- [ ] Traffic legend box included
- [ ] Network isolation explanation box included
- [ ] Canvas sized appropriately (1900x1500 for complex infra)
- [ ] VPC Peering / Transit Gateway shown in separate zone
- [ ] Edge/internet services (CloudFront, Route53, WAF) in separate zone

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

**Azure:**
```bash
grep -i "gateway" references/azure2-complete-catalog.txt
grep -i "virtual_machine\|load_balancer\|key_vault" references/azure2-complete-catalog.txt
```

**AWS:**
```bash
grep -i "lambda" references/aws4-complete-catalog.txt
grep -i "load_balancing\|cloudfront\|route_53" references/aws4-complete-catalog.txt
```

Use verified paths in diagram cell styles:

**Azure** (SVG image style):
```text
image;aspect=fixed;html=1;points=[];align=center;image=img/lib/azure2/<category>/<Icon_Name>.svg;
```

**AWS** (stencil shape style — AWS4 icons are stencils, not SVG files):
```text
shape=mxgraph.aws4.<shape_name>;fillColor=<service_color>;fontColor=#ffffff;strokeColor=none;
```

For Azure renderer resilience, absolute URLs also work:

```text
image;aspect=fixed;html=1;...;image=https://raw.githubusercontent.com/jgraph/drawio/dev/src/main/webapp/img/lib/azure2/<category>/<Icon_Name>.svg;
```

If local rendering still fails, open in `app.diagrams.net`.

See [references/REFERENCE.md](references/REFERENCE.md) for known-good Azure2 and AWS4 icon examples.

## Fallback Strategy if Icons Still Fail

If Azure or AWS icons still do not render:

- Do **not** generate the diagram with an unresolved icon set.
- Return the missing icon list and propose verified replacements (grepped from the relevant catalog).
- After replacements validate to `OK`, then generate the diagram.

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

- For non-Azure/non-AWS diagrams: diagram is generated and renders correctly.
- For Azure diagrams: all icon paths confirmed against `references/azure2-complete-catalog.txt` before calling `drawio/create_diagram`.
- For AWS diagrams: all icon paths confirmed against `references/aws4-complete-catalog.txt` before calling `drawio/create_diagram`.
- If render issues found, alternative icon paths sourced from the relevant catalog and substituted.
- Diagram generated via `drawio/create_diagram` only with confirmed icon paths.
- XML is valid and opens in draw.io.
- Cloud resources are identifiable (icons and clear service labels).
- **For Azure infrastructure/network diagrams**:
  - VNets use thick borders (strokeWidth=4) and are color-coded
  - Subnets use dashed borders (strokeWidth=2, dashPattern=8 8)
  - All resources positioned inside their respective subnets
  - All traffic flows labeled with protocols and ports
  - Traffic legend box included (bottom-left)
  - Network isolation explanation box included (top-left)
  - Canvas appropriately sized (1900x1500 for complex topologies)
  - VNet peering and external services in separate zones
- **For AWS infrastructure/network diagrams**:
  - VPCs use thick borders (strokeWidth=4) and are colour-coded by environment
  - Subnets use dashed borders and are colour-coded by tier (public/private/isolated)
  - Availability Zone containers group subnets per AZ
  - All resources positioned inside their respective subnets
  - Internet Gateway and NAT Gateway shown for public/private egress
  - All traffic flows labeled with protocols and ports
  - Traffic legend box included (bottom-left)
  - Network isolation explanation box included (top-left)
  - Canvas appropriately sized (1900x1500 for complex topologies)
  - VPC Peering / Transit Gateway and edge services in separate zones
- Layout anti-patterns checked against [references/layout-antipatterns.md](references/layout-antipatterns.md) before finalising