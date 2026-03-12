# Draw.io Azure2 & AWS4 References

This folder contains reference artifacts for the `drawio-mcp-diagramming` skill.

## Files

- `azure2-complete-catalog.txt`
  - Complete Azure2 icon inventory (648 icons) from `jgraph/drawio` GitHub tree under `img/lib/azure2`.
  - Use this as the canonical lookup for Azure icon paths — **no scripts needed at agent runtime**.
  - Agent usage: `grep -i "keyword" references/azure2-complete-catalog.txt`

- `aws4-complete-catalog.txt`
  - Complete AWS4 stencil shape inventory (1,037 shapes) extracted from `jgraph/drawio` stencil XML.
  - **AWS4 icons are stencil-based** — referenced as `shape=mxgraph.aws4.<name>`, not as SVG files.
  - Each line in the catalog is a ready-to-use `shape=mxgraph.aws4.*` style string.
  - Agent usage: `grep -i "keyword" references/aws4-complete-catalog.txt`
  - Generate/refresh with: `python3 scripts/search_aws4_icons_github.py --max-results 9999 > references/aws4-complete-catalog.txt`

- `layout-antipatterns.md`
  - Worked examples of layout problems (stacked edges, repeated labels, observability inside VNet/VPC, etc.)
  - Derived from real diagram review sessions.
  - Use this as the first reference when a diagram looks cluttered or has overlapping lines/labels.

## Refresh Workflow

Refresh the catalogs when draw.io updates its icon library (not required per-run):

### Azure2 Catalog

```bash
cd .github/skills/drawio-mcp-diagramming/scripts
python3 search_azure2_icons_github.py --max-results 9999 > ../references/azure2-complete-catalog.txt
```

### AWS4 Catalog

```bash
cd .github/skills/drawio-mcp-diagramming/scripts
python3 search_aws4_icons_github.py --max-results 9999 > ../references/aws4-complete-catalog.txt
```

## Notes

- The catalogs are pre-generated — agents should grep them directly rather than running scripts.
- If an icon appears missing from a catalog, re-run the relevant refresh workflow above.
- If render review shows bad/missing icons, grep the catalog for alternative paths and substitute.

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
- Include a traffic legend showing different traffic types with color-coded arrows
- Add a network isolation explanation box showing the visual conventions
- Use a larger canvas (1900x1500) to accommodate the multi-VNet topology
- Color-code different zones (DMZ VNet in yellow, Internal VNet in green,
  Management zone in blue, VNet Peering in grey, External Services in orange)
- Show VNet peering connections and external services in separate zones
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
- Include a traffic legend showing different traffic types with colour-coded arrows
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

### Multi-Cloud (Azure + AWS) Architecture Diagram

```text
Use drawio/create_diagram to generate a multi-cloud architecture diagram
showing both Azure and AWS components connected via [VPN/ExpressRoute/Direct Connect].

Use Azure2 image styles (image=img/lib/azure2/...) for Azure resources.
Use AWS4 image styles (image=img/lib/aws4/...) for AWS resources.
Show connectivity, data replication, and identity federation between the clouds.
```

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

## Known-Good AWS4 Icon Examples

AWS4 icons use stencil syntax: `shape=mxgraph.aws4.<name>`. Always confirm the exact name against `aws4-complete-catalog.txt` before use.

```text
shape=mxgraph.aws4.ec2;fillColor=#ED7100;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.lambda;fillColor=#ED7100;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.elastic_container_service;fillColor=#ED7100;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.elastic_kubernetes_service;fillColor=#ED7100;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.application_load_balancer;fillColor=#8C4FFF;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.cloudfront;fillColor=#8C4FFF;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.route_53;fillColor=#8C4FFF;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.vpc;fillColor=#8C4FFF;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.transit_gateway;fillColor=#8C4FFF;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.s3;fillColor=#3F8624;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.efs;fillColor=#3F8624;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.rds;fillColor=#C7131F;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.dynamodb;fillColor=#C7131F;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.elasticache;fillColor=#C7131F;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.iam;fillColor=#DD344C;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.key_management_service;fillColor=#DD344C;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.waf;fillColor=#DD344C;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.cognito;fillColor=#DD344C;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.cloudwatch;fillColor=#E7157B;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.cloudformation;fillColor=#E7157B;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.cloudtrail;fillColor=#E7157B;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.sqs;fillColor=#E7157B;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.sns;fillColor=#E7157B;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.eventbridge;fillColor=#E7157B;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.api_gateway;fillColor=#8C4FFF;fontColor=#ffffff;strokeColor=none;
shape=mxgraph.aws4.codepipeline;fillColor=#C7131F;fontColor=#ffffff;strokeColor=none;
```

> **Note:** Shape names in the catalog use underscores. If a shape does not render, grep the catalog for partial name matches (e.g. `grep -i "gateway" references/aws4-complete-catalog.txt`).