# Draw.io MCP Diagramming — Reference Index

This folder contains reference artifacts for the `drawio-mcp-diagramming` skill.

## Shape Discovery

See `SKILL.md` § Icon Discovery for the hard gate, query-by-category table, style format by library, and fallback flow — not restated here.

## Reference Files

- `layout-antipatterns.md`
  - Worked examples of layout problems (stacked edges, repeated labels, observability inside VNet/VPC, etc.)
  - Derived from real diagram review sessions.
  - Use this as the first reference when a diagram looks cluttered or has overlapping lines/labels.

- `azure.md`
  - Azure icon libraries (azure2, mscae) and their caveats, nested VNet → subnet container structure, colour/border conventions, traffic palette, a complete topology example, and the Azure checklist.
  - Read for any diagram containing Azure services.

- `aws.md`
  - AWS4 stencil library and its caveats, nested VPC → AZ → subnet container structure, subnet-tier colour coding, NAT/IGW egress paths, a complete topology example, and the AWS checklist.
  - Read for any diagram containing AWS services.

- `gcp.md`
  - gcp2 stencil library and its caveats, the global-VPC/regional-subnet container model (not a direct analogue of Azure's VNet/subnet or AWS's VPC/AZ/subnet hierarchy), VPC-level firewall-rule annotation, a complete topology example, and the GCP checklist.
  - Read for any diagram containing GCP services. No stencil names in this file are pre-validated against a live `search_shapes` call — confirm every one before use.

- `standalone-file-requirements.md`
  - Required XML attributes when writing a `.drawio` file directly (MCP tool unavailable): `as="geometry"` on every `<mxGeometry>`, and standard `mxGraphModel` layout attributes.
  - Includes a full minimal wrapper template.

## Example Prompt Templates

### Azure Network Topology Diagram (Infrastructure Focus)

```text
Create a professional Azure network topology diagram from my Terraform infrastructure
in the components/ folder, emphasizing network isolation and traffic flows.

Requirements:
- Show VNet architecture with clear network boundaries (use thick borders strokeWidth=4
  for VNets, dashed borders strokeWidth=2 dashPattern=8 8 for subnets)
- Position all resources (VMs, databases, load balancers, etc.) inside their
  respective subnets to show network isolation
- Label all traffic flows with protocols and ports (e.g., HTTPS:443,
  PostgreSQL:5432, HTTP:8080)
- Add a network isolation explanation box only when the topology needs the extra explanation
- Use a larger canvas (1900x1500) to accommodate the multi-VNet topology
- Color-code different zones only when they represent real boundaries (perimeter/ingress in yellow,
  internal in green, management in blue, VNet peering in grey, external services in orange)
- Show VNet peering connections and external services in separate zones when they help explain the topology
- Use Azure2 icons from draw.io MCP

Focus on the networking aspects - how components are isolated, how traffic flows
between them, and what the network boundaries are.
```

### Basic Azure Architecture Diagram

```text
Use drawio/create_diagram to generate a hub-spoke Azure architecture diagram.
Use Azure2 image styles (image=img/lib/azure2/...) for all Azure resources.
Include [list services] and show ingress/egress/telemetry flows.
```

### AWS Network Topology Diagram (Infrastructure Focus)

```text
Create a professional AWS network topology diagram emphasising VPC design,
subnet tiers, and traffic flows.

Requirements:
- Show VPC architecture with clear network boundaries (use thick borders strokeWidth=4
  for VPCs, dashed borders strokeWidth=2 dashPattern=8 8 for subnets)
- Group subnets by Availability Zone using light grey AZ containers
- Colour-code subnet tiers: public (light green), private (light blue),
  isolated/database (light orange)
- Position all resources (EC2, RDS, Lambda, ALB, etc.) inside their respective subnets
- Show Internet Gateway and NAT Gateway for public/private subnet egress
- Label all traffic flows with protocols and ports (e.g., HTTPS:443,
  PostgreSQL:5432, SSH:22)
- Add a network isolation explanation box (VPC thick borders, subnet dashed borders,
  SG/NACL annotations, VPC Endpoints for private AWS service access)
- Use a larger canvas (1900x1500) for multi-VPC/multi-account topologies
- Separate internet/edge services zone (CloudFront, Route53, WAF, Shield)
  and VPC Peering / Transit Gateway zone
- Use AWS4 icons from draw.io MCP

Focus on the networking aspects - VPC isolation boundaries, AZ redundancy,
traffic routing, and security controls.
```

### Basic AWS Architecture Diagram

```text
Use drawio/create_diagram to generate a 3-tier AWS architecture diagram.
Use AWS4 image styles (image=img/lib/aws4/...) for all AWS resources.
Include [list services] and show ingress/egress/data flows.
```

### GCP Network Topology Diagram (Infrastructure Focus)

```text
Create a professional GCP network topology diagram emphasising VPC design,
regional subnets, and traffic flows.

Requirements:
- Show the VPC as a global container (thick border strokeWidth=4) with regional
  subnets as dashed sub-containers (strokeWidth=2 dashPattern=8 8) — do not model
  subnets as zone-scoped the way AWS AZ subnets are
- Position zonal resources (GKE nodes, Compute Engine, MIGs) inside their regional
  subnet; only add a zone sub-grouping if zonal redundancy is the point of the diagram
- Place the Global External Load Balancer and Cloud CDN OUTSIDE the VPC boundary
  (they are global, anycast resources, not subnet-resident)
- Place Cloud SQL, Pub/Sub, BigQuery, Cloud Storage outside the VPC, connected via
  a dashed Private Service Access / Serverless VPC Access connector edge
- Place Cloud Monitoring, Cloud Logging, and IAM outside any VPC/subnet container
- Annotate firewall rules as VPC-level (GCP has no NACL equivalent)
- Label all traffic flows with protocols and ports
- Use a larger canvas (1900x1500) for Shared VPC or multi-VPC topologies
- Use GCP stencil icons confirmed via drawio/search_shapes

Focus on the networking aspects - what is global vs. regional vs. zonal, how
traffic enters the VPC, and where managed services actually live.
```

### Basic GCP Architecture Diagram

```text
Use drawio/create_diagram to generate a 3-tier GCP architecture diagram.
Confirm every icon via drawio/search_shapes before use (gcp2 stencil library).
Include [list services] and show ingress/egress/data flows.
```

### Multi-Cloud (Azure + AWS + GCP) Architecture Diagram

```text
Use drawio/create_diagram to generate a multi-cloud architecture diagram
showing Azure, AWS, and/or GCP components connected via [VPN/ExpressRoute/Direct Connect/
Cloud Interconnect].

Use Azure2 image styles (image=img/lib/azure2/...) for Azure resources.
Use AWS4 shape styles (shape=mxgraph.aws4.*) for AWS resources.
Use gcp2 shape styles (shape=mxgraph.gcp2.*) for GCP resources, confirmed via drawio/search_shapes.
Show connectivity, data replication, and identity federation between the clouds.
```

## Diagram-Type Prompt Presets

Use these compact prompts to route the agent to the right input format and conventions.

### Flowchart

```text
Create a flowchart showing the decision flow for [process]. Use Mermaid if possible. Keep it left-to-right, label decision diamonds clearly, and use orthogonal edges.
```

### Sequence diagram

```text
Draw a sequence diagram for [interaction]. Show participants [A, B, C], label each message, and use activation bars. Use Mermaid.
```

### Entity Relationship diagram

```text
Generate an ER diagram from this SQL/schema: [schema]. Use Mermaid erDiagram syntax. Mark primary keys and foreign-key relationships.
```

### C4 model

```text
Create a C4 Container diagram for [system]. Show users, containers, databases, and external systems. Use official C4 shapes and keep the diagram at container scope only.
```

### Azure network topology

```text
Create a professional Azure network topology diagram for [description]. Use Azure2 icons, VNets with thick borders, subnets with dashed borders, position resources inside subnets, label traffic with protocols/ports, and include a traffic legend and network isolation explanation box.
```

### AWS network topology

```text
Create a professional AWS network topology diagram for [description]. Use AWS4 icons with correct fill colours, VPCs with thick borders, public/private/isolated subnets with dashed borders, and label all traffic flows.
```

### GCP network topology

```text
Create a professional GCP network topology diagram for [description]. Use gcp2 icons confirmed via drawio/search_shapes, model the VPC as global with regional (not zonal) subnets, keep the Global External LB and managed services outside the VPC boundary, and label all traffic flows.
```

### Cross-functional swimlane

```text
Create a cross-functional flowchart for [process] with swimlanes for [actors]. Number the steps, show decision points, and use the standard edge colour conventions.
```

## Input Format Details

### Mermaid

Mermaid is the fastest path for many standard diagram types. The draw.io server parses Mermaid natively and converts it to editable draw.io XML.

- Use Mermaid when the user asks for flowcharts, sequence diagrams, ER diagrams, class diagrams, state diagrams, mind maps, Gantt charts, timelines, or kanban boards.
- Use XML when the user needs official cloud icons, precise positioning, complex containers, or custom styling.

Example App Server call:

```json
{
  "mermaid": "flowchart LR\n  A[Start] --> B{Decision?}\n  B -->|Yes| C[Do thing]\n  B -->|No| D[Skip]"
}
```

Example Tool Server call:

```json
{
  "content": "flowchart LR\n  A[Start] --> B{Decision?}\n  B -->|Yes| C[Do thing]\n  B -->|No| D[Skip]"
}
```

> For complex flowcharts (≥ ~20 nodes, ≥ 3 decision diamonds, feedback edges, or ≥ 3 endpoints), the App Server's native Mermaid layout can become cramped. Add `postLayout: "elk"` to re-layout the result. The flow direction is taken from the Mermaid code (`TD/TB` vs `LR/RL`).

### CSV

CSV input is useful for org charts and simple labeled diagrams. The first row is the header; each subsequent row becomes a node. Edge relationships are typically expressed with `id` and `parent` columns. See the Tool Server documentation for the exact CSV schema.

### Multi-page `.drawio` files (Tool Server only)

Use these tools to inspect or edit one page of a multi-page `.drawio` file without rewriting the whole file:

- `drawio/list_pages` — list pages by index, id, name, and approximate size.
- `drawio/get_page` — retrieve the `mxGraphModel` XML for a single page.
- `drawio/set_page` — replace a single page's content.

Use these when the user says "update page 2 of my architecture diagram" or "add a new diagram page to this file".

## Known-Good Icon Examples

Vendor icon examples now live with the rest of the vendor guidance: see `azure.md` for azure2/mscae paths and `aws.md` for AWS4 style strings.
