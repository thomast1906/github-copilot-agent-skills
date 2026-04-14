// Website-only metadata overlaying source file data.
// This is the single source of truth for display-only fields.

export type SkillCategory =
  | 'azure-architecture'
  | 'azure-apim'
  | 'infrastructure-as-code'
  | 'diagramming'
  | 'github-workflows';

export type SkillStatus = 'stable' | 'wip';

export interface PackageMeta {
  featured: boolean;
}

export const packageMeta: Record<string, PackageMeta> = {
  'architect':   { featured: true },
  'diagramming': { featured: false },
  'terraform':   { featured: true },
};

export interface McpServer {
  id: string;
  name: string;
  description: string;
  installation: string;
  skills: string[];
  required: boolean;
}

export const mcpServers: McpServer[] = [
  {
    id: 'azure-mcp',
    name: 'Azure MCP',
    description: 'Connects GitHub Copilot to your Azure subscriptions for live pricing, resource queries, and architecture recommendations.',
    installation: 'Install the Azure Tools VS Code extension — the Azure MCP Server registers automatically.',
    skills: ['architecture-design', 'waf-assessment', 'cost-optimization', 'azure-pricing'],
    required: false,
  },
  {
    id: 'drawio-mcp',
    name: 'Draw.io MCP',
    description: 'Enables Copilot to create and edit Draw.io diagrams with full access to Azure icon libraries.',
    installation: 'Install the Draw.io integration VS Code extension and enable MCP in VS Code settings.',
    skills: ['azure-drawio-mcp-diagramming', 'drawio-mcp-diagramming'],
    required: false,
  },
  {
    id: 'excalidraw-mcp',
    name: 'Excalidraw MCP',
    description: 'Enables Copilot to create hand-drawn style architecture sketches using Excalidraw.',
    installation: 'Install the Excalidraw VS Code extension and configure the MCP server in your Copilot settings.',
    skills: ['excalidraw-mcp-diagramming'],
    required: false,
  },
  {
    id: 'terraform-mcp',
    name: 'Terraform MCP',
    description: 'Gives Copilot access to Terraform registry documentation for provider version analysis and upgrade planning.',
    installation: 'Install HashiCorp Terraform extension and enable the Terraform MCP server integration.',
    skills: ['terraform-provider-upgrade'],
    required: false,
  },
];
