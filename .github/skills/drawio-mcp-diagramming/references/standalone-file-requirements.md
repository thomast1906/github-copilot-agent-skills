# Standalone .drawio File Requirements

The XML examples in this skill (and in `topology-patterns.md`) are **designed for `drawio/create_diagram`**, which wraps the `mxGraphModel` payload automatically. When the MCP tool is unavailable and you must write a `.drawio` file directly, two extra things are required that the MCP tool normally provides:

## 1. `as="geometry"` on every `<mxGeometry>` element

Without it, draw.io cannot parse coordinates and all elements collapse to the origin (appear stacked in one corner).

```xml
<!-- Wrong (MCP-tool shorthand only): -->
<mxGeometry x="100" y="100" width="64" height="64"/>

<!-- Correct for a .drawio file: -->
<mxGeometry x="100" y="100" width="64" height="64" as="geometry"/>
```

## 2. Standard layout attributes on `<mxGraphModel>`

Without `dx`/`dy`/`grid`/`gridSize`, draw.io defaults to zero offsets and the canvas renders blank or misaligned.

```xml
<!-- Use this header for all standalone .drawio files: -->
<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1400" pageHeight="700" math="0" shadow="0">
```

## Full minimal wrapper

```xml
<mxfile>
  <diagram name="Diagram Name" id="unique-id">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1400" pageHeight="700" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <!-- all content cells here with parent="1" and as="geometry" -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

> Do not include XML comments (`<!-- ... -->`) in `.drawio` files — some parsers handle them inconsistently.
