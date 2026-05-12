# Topology Pattern XML Examples

Complete example `mxGraphModel` XML for Azure and AWS infrastructure topology diagrams.

---

## Azure Infrastructure Topology

```xml
<mxGraphModel pageWidth="1900" pageHeight="1500">
  <!-- VNet container (thick border, green) -->
  <mxCell id="vnet" value="Internal VNet - 10.x.0.0/16"
    style="rounded=0;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;
    verticalAlign=top;fontSize=16;fontStyle=1;strokeWidth=4;"
    vertex="1" parent="1"><mxGeometry x="220" y="200" width="1340" height="820"/></mxCell>
  <!-- Subnet container (dashed, inside VNet) -->
  <mxCell id="subnet" value="Application Subnet - 10.x.2.0/24"
    style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e6f4ea;strokeColor=#82b366;
    verticalAlign=top;fontSize=13;fontStyle=1;strokeWidth=2;dashed=1;dashPattern=8 8;"
    vertex="1" parent="1"><mxGeometry x="260" y="280" width="480" height="300"/></mxCell>
  <!-- Resource inside subnet (verify path: grep -i "virtual_machine" references/azure2-complete-catalog.txt) -->
  <mxCell id="vm" value="App VM"
    style="image;aspect=fixed;html=1;points=[];align=center;
    image=img/lib/azure2/compute/Virtual_Machine.svg;"
    vertex="1" parent="1"><mxGeometry x="300" y="350" width="64" height="59"/></mxCell>
  <!-- Traffic edge: HTTPS:443 internet ingress (blue) -->
  <mxCell id="e1" value="HTTPS:443"
    style="edgeStyle=orthogonalEdgeStyle;strokeWidth=3;strokeColor=#0078D4;"
    edge="1" source="inet" target="vm" parent="1"><mxGeometry relative="1"/></mxCell>
  <!-- Network Isolation Explanation box (top-left, yellow) -->
  <mxCell id="iso" value="&lt;b&gt;Network Isolation&lt;/b&gt;&lt;br&gt;VNets: Thick borders&lt;br&gt;Subnets: Dashed borders&lt;br&gt;NSGs control traffic"
    style="text;html=1;strokeColor=#d6b656;fillColor=#fff9cc;align=left;
    verticalAlign=top;spacingLeft=10;rounded=1;"
    vertex="1" parent="1"><mxGeometry x="20" y="20" width="220" height="100"/></mxCell>
  <!-- Zone Separation: External Services (orange), VNet Peering (grey) -->
  <mxCell id="ext" value="External Services"
    style="rounded=0;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;
    verticalAlign=top;fontStyle=1;strokeWidth=2;"
    vertex="1" parent="1"><mxGeometry x="20" y="200" width="180" height="200"/></mxCell>
</mxGraphModel>
```

---

## AWS Infrastructure Topology

```xml
<mxGraphModel pageWidth="1900" pageHeight="1500">
  <!-- VPC container (thick border, green) -->
  <mxCell id="vpc" value="Production VPC - 10.x.0.0/16"
    style="rounded=0;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;
    verticalAlign=top;fontSize=16;fontStyle=1;strokeWidth=4;"
    vertex="1" parent="1"><mxGeometry x="220" y="200" width="1200" height="900"/></mxCell>
  <!-- Public subnet (light green, dashed) -->
  <mxCell id="pub" value="Public Subnet - us-east-1a - 10.x.1.0/24"
    style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e6f4ea;strokeColor=#82b366;
    verticalAlign=top;fontSize=12;fontStyle=1;strokeWidth=2;dashed=1;dashPattern=8 8;"
    vertex="1" parent="1"><mxGeometry x="260" y="280" width="500" height="200"/></mxCell>
  <!-- Private subnet (light blue, dashed) -->
  <mxCell id="prv" value="Private Subnet - us-east-1a - 10.x.2.0/24"
    style="rounded=1;whiteSpace=wrap;html=1;fillColor=#EFF7FF;strokeColor=#6c8ebf;
    verticalAlign=top;fontSize=12;fontStyle=1;strokeWidth=2;dashed=1;dashPattern=8 8;"
    vertex="1" parent="1"><mxGeometry x="260" y="520" width="500" height="200"/></mxCell>
  <!-- ALB in public subnet (verify: grep -i "load_balancer" references/aws4-complete-catalog.txt) -->
  <mxCell id="alb" value="ALB"
    style="shape=mxgraph.aws4.application_load_balancer;fillColor=#8C4FFF;
    fontColor=#ffffff;strokeColor=none;"
    vertex="1" parent="1"><mxGeometry x="320" y="340" width="64" height="64"/></mxCell>
  <!-- ECS task in private subnet -->
  <mxCell id="ecs" value="ECS Task"
    style="shape=mxgraph.aws4.ecs;fillColor=#ED7100;fontColor=#ffffff;strokeColor=none;"
    vertex="1" parent="1"><mxGeometry x="320" y="580" width="64" height="64"/></mxCell>
  <!-- Traffic: internet → ALB: HTTPS:443 (blue) -->
  <mxCell id="e1" value="HTTPS:443"
    style="edgeStyle=orthogonalEdgeStyle;strokeWidth=3;strokeColor=#0078D4;"
    edge="1" source="igw" target="alb" parent="1"><mxGeometry relative="1"/></mxCell>
  <!-- Traffic: ALB → ECS: HTTP:8080 (teal) -->
  <mxCell id="e2" value="HTTP:8080"
    style="edgeStyle=orthogonalEdgeStyle;strokeWidth=2;strokeColor=#00897B;"
    edge="1" source="alb" target="ecs" parent="1"><mxGeometry relative="1"/></mxCell>
  <!-- Network Isolation Explanation box (top-left, yellow) -->
  <mxCell id="iso" value="&lt;b&gt;Network Isolation&lt;/b&gt;&lt;br&gt;VPCs: Thick borders&lt;br&gt;Public/Private/Isolated subnets&lt;br&gt;Security Groups + NACLs"
    style="text;html=1;strokeColor=#d6b656;fillColor=#fff9cc;align=left;
    verticalAlign=top;spacingLeft=10;rounded=1;"
    vertex="1" parent="1"><mxGeometry x="20" y="20" width="240" height="110"/></mxCell>
</mxGraphModel>
```
