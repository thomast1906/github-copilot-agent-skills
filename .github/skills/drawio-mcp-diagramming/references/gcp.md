# GCP Diagram Guidance

Everything GCP-specific for draw.io MCP diagrams: the GCP stencil library and its caveats, VPC/region/subnet container structure, colour conventions, and the topology checklist.

Read this file when the diagram contains GCP services — whether it is a full VPC topology or a handful of GCP icons in a flow diagram.

Contents:
- [GCP icon library and caveats](#gcp-icon-library-and-caveats)
- [VPC, region, and subnet container structure](#vpc-region-and-subnet-container-structure)
- [Styles and colours](#styles-and-colours)
- [Resource placement rules](#resource-placement-rules)
- [Traffic flow colour palette](#traffic-flow-colour-palette)
- [Annotation boxes](#annotation-boxes)
- [Complete topology example](#complete-topology-example)
- [GCP topology checklist](#gcp-topology-checklist)

---

## GCP icon library and caveats

GCP icons are stencils, referenced as `shape=mxgraph.gcp2.<name>` (an older `mxgraph.gcp.*` library also exists in some installs — use whichever `drawio/search_shapes` actually returns, do not assume one over the other).

1. **Naming convention** — stencil names are lowercase and underscore-delimited, derived from the human-readable service name (e.g. "Cloud SQL" → `cloud_sql`, not `Cloud SQL` or `cloud-sql`). This mirrors the AWS4 naming pattern in [aws.md](aws.md).
2. **No pre-validated icon list in this file** — unlike [azure.md](azure.md) and [aws.md](aws.md), this reference does not ship a "known-good" style-string list for GCP. Treat every GCP shape as unconfirmed until `drawio/search_shapes` returns it, and use the returned style string exactly as given — do not pattern-match a name from memory or from another vendor's convention.
3. **Library/environment mismatch** — as with AWS4, some embedded viewers do not load the `mxgraph.gcp2` stencil library. If a shape does not render in VS Code, test the same XML in `app.diagrams.net` before changing the style string.

Official Google Cloud category colours (safe to use for generic boxes and legends; confirm actual stencil `fillColor` via `search_shapes`, since some GCP stencils already bake in their own colour):

| Category | Colour |
|---|---|
| Compute / primary | `#4285F4` Google Blue |
| Storage / success | `#34A853` Google Green |
| Error / denied | `#EA4335` Google Red |
| Warning / identity | `#FBBC04` Google Yellow |
| Neutral / managed service | `#5F6368` Google Grey |

If a shape still fails, re-query `search_shapes` (raise `limit`, up to 50) and substitute a confirmed style string rather than guessing a variant name.

---

## VPC, region, and subnet container structure

GCP's networking model is **not** a direct analogue of Azure's VNet/subnet or AWS's VPC/AZ/subnet hierarchy — the mismatch is the most common source of an architecturally wrong GCP diagram. Model it with real containment — see [xml-authoring-rules.md](xml-authoring-rules.md) for the general containment rule.

- A **VPC network** is global and has no IP range of its own (in custom-subnet mode). Model it as the outermost `swimlane;startSize=24;` at `parent="1"`.
- A **subnet** is a **regional** resource — it automatically spans every zone in that region. It does **not** belong to a single zone the way an AWS subnet belongs to a single AZ. Model each subnet as a `swimlane;startSize=24;` with `parent="<vpc_id>"`, labelled with its region and CIDR (e.g. "Subnet - us-central1 - 10.0.1.0/24"). Do not add a zone-level container layer unless zonal placement genuinely matters.
- Only add a **Zone** sub-container inside a subnet when zonal detail is the point of the diagram (e.g. spreading GKE node pools or a Managed Instance Group across `us-central1-a` / `-b` / `-c` for redundancy). Label it clearly as a zone grouping, not a network boundary — the subnet, not the zone, is the IP/firewall boundary.
- **Firewall rules are VPC-level**, not subnet-level — GCP has no NACL equivalent. Applied via network tags or service accounts, they scope to the VPC (or a specific subnet target), never to an AZ the way an AWS NACL does. Annotate firewall rules as a VPC-wide note, not a per-subnet box.
- Edges between resources in different subnets or VPCs sit at `parent="1"`.
- **Shared VPC** (host/service project split) and **VPC Peering** are cross-project/cross-VPC connectivity — model as a separate top-level zone container, same pattern as Transit Gateway in [aws.md](aws.md).

---

## Styles and colours

| Element | Style |
|---|---|
| VPC (Production) | `swimlane;startSize=24;fillColor=#d5e8d4;strokeColor=#82b366;strokeWidth=4;` |
| VPC (Development) | `swimlane;startSize=24;fillColor=#dae8fc;strokeColor=#6c8ebf;strokeWidth=4;` |
| VPC (Shared VPC host) | `swimlane;startSize=24;fillColor=#fff2cc;strokeColor=#d6b656;strokeWidth=4;` |
| Subnet (public / has external IPs) | `swimlane;startSize=24;fillColor=#e6f4ea;strokeColor=#82b366;dashed=1;dashPattern=8 8;strokeWidth=2;` |
| Subnet (private, no external IPs) | `swimlane;startSize=24;fillColor=#EFF7FF;strokeColor=#6c8ebf;dashed=1;dashPattern=8 8;strokeWidth=2;` |
| Zone sub-grouping (optional, inside a subnet) | `swimlane;startSize=20;fillColor=#f5f5f5;strokeColor=#999999;strokeWidth=1;dashed=1;` |

Label subnets with name, region, and CIDR. Canvas: `pageWidth="1900" pageHeight="1500"` for multi-VPC or Shared VPC topologies.

---

## Resource placement rules

- **Global external Application Load Balancer / Cloud CDN** — these are global, anycast-fronted resources, **not** subnet-resident. Place them outside the VPC boundary (edge/global zone), connected to backend services inside the VPC by a forwarding-rule edge. This is the opposite of AWS, where the ALB sits inside a public subnet — do not nest a GCP global LB inside a subnet container.
- **Internal / regional Load Balancer** — this *is* a regional resource attached to the VPC's region; it can be shown inside the VPC container at the subnet level.
- Compute Engine VMs, GKE nodes → private or public subnet depending on whether they hold external IPs.
- **Cloud SQL** — lives in a separate Google-managed tenant project and connects over Private Service Access (a VPC peering relationship), not as a literal subnet-resident instance. Show it just outside the VPC boundary with a dashed "Private Service Access" edge into the VPC, rather than nesting it inside a subnet the way AWS RDS is nested inside a VPC.
- **Cloud Storage, BigQuery, Pub/Sub, Cloud Functions, Cloud Run** — serverless/global/regional managed services. Place outside the VPC; if the diagram shows private connectivity, use a "Serverless VPC Access connector" edge rather than nesting the service inside the VPC.
- **Cloud Monitoring, Cloud Logging, Cloud IAM, Artifact Registry** — global managed services, same rule as Azure Monitor / CloudWatch in [layout-antipatterns.md](layout-antipatterns.md#observability-zone-placement): keep them **outside** any VPC or subnet container, connected by a dashed telemetry/IAM edge that exits the VPC boundary.

---

## Traffic flow colour palette

Consistent with the Azure and AWS palettes elsewhere in this skill:

| Traffic type | Colour | Style |
|---|---|---|
| HTTPS:443 internet ingress (via Global LB) | `#0078D4` Blue | solid, `strokeWidth=3` |
| HTTP backend / service-to-service | `#00897B` Teal | solid, `strokeWidth=2` |
| Database (Cloud SQL, Private Service Access) | `#5C6BC0` Indigo | dashed, `strokeWidth=2` |
| Serverless VPC Access / managed service connector | `#43A047` Green | solid, `strokeWidth=2` |
| IAM / Cloud Monitoring / Cloud Logging | `#F57C00` Amber | dashed, `strokeWidth=2` |
| Denied/blocked (firewall deny rule) | `#C62828` Red | solid — reserve exclusively for blocked traffic |

---

## Annotation boxes

1. **Network Isolation Explanation** — top-left: VPC is global, subnets are regional (span all zones), firewall rules are VPC-level (no NACL equivalent), Private Service Access for managed-service connectivity.
2. **Zone Separation** — Edge/Global zone (Global external LB, Cloud CDN, Cloud Armor, Cloud DNS), Shared VPC / VPC Peering zone, Google-managed services zone (Cloud SQL, Pub/Sub, BigQuery, Cloud Storage).

---

## Complete topology example

Nested containers, relative child coordinates, cross-container edges at `parent="1"`, and `as="geometry"` on every geometry element.

This example uses plain coloured rectangles (`rounded=1;whiteSpace=wrap;html=1;fillColor=...`) rather than specific `mxgraph.gcp2.*` stencil names — per the caveat above, no GCP stencil name in this file has been confirmed against a live `drawio/search_shapes` call. Before generating a real diagram, replace each rectangle's style with the confirmed stencil style string for that service.

```xml
<mxGraphModel pageWidth="1900" pageHeight="1500">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="iso" value="&lt;b&gt;Network Isolation&lt;/b&gt;&lt;br&gt;VPC: global, no IP range of its own&lt;br&gt;Subnets: regional, span all zones&lt;br&gt;Firewall rules: VPC-level (no NACL)&lt;br&gt;Private Service Access for managed services" style="text;html=1;strokeColor=#d6b656;fillColor=#fff9cc;align=left;verticalAlign=top;spacingLeft=10;rounded=1;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="280" height="120" as="geometry"/>
    </mxCell>
    <mxCell id="glb" value="Global External LB" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#4285F4;fontColor=#ffffff;strokeColor=none;" vertex="1" parent="1">
      <mxGeometry x="40" y="220" width="160" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="vpc" value="Production VPC (global)" style="swimlane;startSize=24;html=1;fillColor=#d5e8d4;strokeColor=#82b366;strokeWidth=4;fontSize=16;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="360" y="200" width="920" height="480" as="geometry"/>
    </mxCell>
    <mxCell id="snet-priv" value="Subnet - us-central1 - 10.0.2.0/24 (private)" style="swimlane;startSize=24;html=1;fillColor=#EFF7FF;strokeColor=#6c8ebf;strokeWidth=2;dashed=1;dashPattern=8 8;fontSize=12;" vertex="1" parent="vpc">
      <mxGeometry x="40" y="50" width="400" height="380" as="geometry"/>
    </mxCell>
    <mxCell id="gke" value="GKE Node Pool" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#4285F4;fontColor=#ffffff;strokeColor=none;" vertex="1" parent="snet-priv">
      <mxGeometry x="40" y="60" width="160" height="64" as="geometry"/>
    </mxCell>
    <mxCell id="sql" value="Cloud SQL (Private Service Access)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#34A853;fontColor=#ffffff;strokeColor=none;" vertex="1" parent="1">
      <mxGeometry x="1360" y="300" width="200" height="70" as="geometry"/>
    </mxCell>
    <mxCell id="mon" value="Cloud Monitoring" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#5F6368;fontColor=#ffffff;strokeColor=none;" vertex="1" parent="1">
      <mxGeometry x="1360" y="420" width="200" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="e-glb-gke" value="HTTPS:443" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#0078D4;strokeWidth=3;" edge="1" parent="1" source="glb" target="gke">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e-gke-sql" value="Private Service Access" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#5C6BC0;strokeWidth=2;dashed=1;" edge="1" parent="1" source="gke" target="sql">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e-gke-mon" value="Telemetry" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#F57C00;strokeWidth=2;dashed=1;" edge="1" parent="1" source="gke" target="mon">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

Generate with `routing: "libavoid"` so connectors route around the containers without moving them.

---

## GCP topology checklist

- [ ] VPC modelled as global (no zone/AZ container layer unless zonal detail is the point of the diagram)
- [ ] Subnets are regional containers, not zonal — labelled with region + CIDR, not an AZ name
- [ ] Global external LB / Cloud CDN placed **outside** the VPC boundary, not nested in a subnet
- [ ] Internal/regional LB (if used) placed inside the VPC at the appropriate subnet
- [ ] Cloud SQL and other managed services connected via a dashed Private Service Access / connector edge, not nested inside a subnet
- [ ] Cloud Monitoring / Cloud Logging / IAM are **outside** any VPC or subnet container
- [ ] Firewall rules annotated as VPC-level, not per-subnet
- [ ] Every stencil style string confirmed via `drawio/search_shapes` before use — none in this file are pre-validated
- [ ] Cross-subnet and cross-VPC edges declared at `parent="1"`
- [ ] Shared VPC / VPC Peering shown as a separate zone container when relevant
- [ ] Canvas 1900×1500 for complex infrastructure
- [ ] `routing: "libavoid"` applied; no hand-written waypoints or exit/entry points
- [ ] Animation preference confirmed before generating
