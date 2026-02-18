---
name: drawio-mcp-diagramming
description: Create and edit architecture diagrams using Draw.io MCP (`drawio/create_diagram`) with reliable Azure icon rendering guidance and troubleshooting.
compatibility: Requires Python 3 and internet access to refresh the icon catalog (periodic, not per-run).
---

# Draw.io MCP Diagramming Skill

Use this skill to create or update diagrams through the Draw.io MCP tool and to avoid common Azure icon rendering problems.

See [references/REFERENCE.md](references/REFERENCE.md) for reference artifacts and refresh commands.

For non-Azure diagrams, you can skip icon discovery/validation scripts and proceed directly to `drawio/create_diagram`.

## When to Use

- The user asks to create or refine architecture diagrams.
- The user wants draw.io/diagrams.net output from an MCP workflow.
- The user needs Azure service icons in diagrams.
- The user reports that Azure icons/shapes are not appearing.

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

1. If diagram uses Azure icons: grep `references/azure2-complete-catalog.txt` to verify icon paths — no scripts needed at runtime.
2. If diagram is not Azure-specific: skip icon lookup and create diagram directly.
3. **For Azure infrastructure/network diagrams**: apply Professional Network Topology Patterns (see section below):
   - Use larger canvas (1900x1500)
   - VNets with thick borders (strokeWidth=4)
   - Subnets with dashed borders (strokeWidth=2, dashPattern=8 8)
   - Position resources inside their subnets
   - Label all traffic flows with protocols/ports
   - Include traffic legend and network isolation explanation boxes
4. Build a valid `mxGraphModel` payload using verified icons when applicable.
5. Call `drawio/create_diagram` with the XML.
6. If user wants a file artifact, save as `.drawio` wrapped in `<mxfile><diagram>...</diagram></mxfile>`.
7. Keep labels concise and explicit (service name + role).
8. For Azure diagrams, prefer one icon per major service and use edges for flow semantics (ingress/egress/peering/telemetry).

## Visual Quality Guardrails

Apply these defaults unless the user explicitly asks for a dense/technical view:

- Use 3-4 major lanes/zones max (for example Source, Pipeline, Azure target).
- Keep primary flow left-to-right with a single main path.
- Use stage numbering (`1`, `2`, `3`, `4`) instead of many edge labels.
- Keep one icon per major service; avoid icon-per-step layouts.
- Limit cross-lane dashed lines to one security/auth line and one optional telemetry line.
- Keep text concise (single purpose per box) and avoid multiline overload.
- Prefer a "clean" variant first; add detail only if requested.

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

### Professional Topology Checklist
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

## How to Discover Icons

Grep the static catalog — no scripts needed at agent runtime:

```bash
grep -i "gateway" references/azure2-complete-catalog.txt
grep -i "virtual_machine\|load_balancer\|key_vault" references/azure2-complete-catalog.txt
```

Use verified paths in diagram cell styles:

```text
image;aspect=fixed;html=1;...;image=img/lib/azure2/<category>/<Icon_Name>.svg;
```

For renderer resilience, absolute URLs also work:

```text
image;aspect=fixed;html=1;...;image=https://raw.githubusercontent.com/jgraph/drawio/dev/src/main/webapp/img/lib/azure2/networking/Application_Gateways.svg;
```

If local rendering still fails, open in `app.diagrams.net`.

## Known-Good Azure2 Icon Examples

```text
image=img/lib/azure2/networking/Front_Doors.svg
image=img/lib/azure2/networking/Private_Link_Hub.svg
image=img/lib/azure2/networking/Network_Watcher.svg
image=img/lib/azure2/app_services/API_Management_Services.svg
image=img/lib/azure2/app_services/App_Services.svg
image=img/lib/azure2/databases/Azure_Cosmos_DB.svg
image=img/lib/azure2/identity/Managed_Identities.svg
image=img/lib/azure2/management_governance/Policy.svg
image=img/lib/azure2/analytics/Log_Analytics_Workspaces.svg
image=img/lib/azure2/management_governance/Monitor.svg
image=img/lib/azure2/devops/Application_Insights.svg
image=img/lib/azure2/devops/API_Connections.svg
```

## Fallback Strategy if Icons Still Fail

If Azure icons still do not render:

- Do **not** generate the Azure diagram with unresolved icon set.
- Return the missing icon list and propose verified replacements.
- After replacements validate to `OK`, then generate the diagram.

## Troubleshooting Checklist

- Confirm MCP server appears in `MCP: List Servers`.
- Run `MCP: Reset Cached Tools` if tool list is stale.
- Ensure XML is well-formed (no malformed tags or invalid comments).
- Verify style uses `image=img/lib/azure2/...` for Azure2 icon mode.
- Reopen diagram in web draw.io if VS Code extension rendering differs.
- If an icon path looks wrong, grep `references/azure2-complete-catalog.txt` for alternatives.
- If the catalog itself appears stale, re-run the refresh workflow in REFERENCE.md.

## Prompt Template for Agents

See [references/REFERENCE.md](references/REFERENCE.md) for full example prompt templates.

## Definition of Done

- For non-Azure diagrams: diagram is generated and renders correctly.
- For Azure diagrams: all icon paths confirmed against `references/azure2-complete-catalog.txt` before calling `drawio/create_diagram`.
- If render issues found, alternative icon paths sourced from catalog and substituted.
- Diagram generated via `drawio/create_diagram` only with confirmed icon paths.
- XML is valid and opens in draw.io.
- Azure resources are identifiable (icons and clear service labels).
- **For Azure infrastructure/network diagrams**:
  - VNets use thick borders (strokeWidth=4) and are color-coded
  - Subnets use dashed borders (strokeWidth=2, dashPattern=8 8)
  - All resources positioned inside their respective subnets
  - All traffic flows labeled with protocols and ports
  - Traffic legend box included (bottom-left)
  - Network isolation explanation box included (top-left)
  - Canvas appropriately sized (1900x1500 for complex topologies)
  - VNet peering and external services in separate zones
