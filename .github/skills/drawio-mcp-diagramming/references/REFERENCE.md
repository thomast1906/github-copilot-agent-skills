# Draw.io Azure2 References

This folder contains reference artifacts for the `drawio-mcp-diagramming` skill.

## Files

- `azure2-complete-catalog.txt`
  - Complete Azure2 icon inventory (648 icons) from `jgraph/drawio` GitHub tree under `img/lib/azure2`.
  - Use this as the canonical lookup for icon paths — **no scripts needed at agent runtime**.
  - Agent usage: `grep -i "keyword" references/azure2-complete-catalog.txt`

## Refresh Workflow

Refresh the catalog when draw.io updates its icon library (not required per-run):

```bash
cd .github/skills/drawio-mcp-diagramming/scripts
python3 search_azure2_icons_github.py --max-results 9999 > ../references/azure2-complete-catalog.txt
```

## Notes

- The catalog is pre-generated — agents should grep it directly rather than running scripts.
- If an icon appears missing from the catalog, re-run the refresh workflow above.
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
Return valid mxGraphModel XML.
```