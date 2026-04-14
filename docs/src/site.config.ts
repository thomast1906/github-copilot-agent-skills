// Website-only metadata overlaying source file data.
// This is the single source of truth for display-only fields.

export type SkillCategory =
  | 'azure-architecture'
  | 'azure-apim'
  | 'infrastructure-as-code'
  | 'diagramming'
  | 'github-workflows';

export type SkillStatus = 'stable' | 'wip';

export interface SkillMeta {
  category: SkillCategory;
  status: SkillStatus;
  featured: boolean;
  mcp: string[];
}

export const skillMeta: Record<string, SkillMeta> = {
  'api-security-review':          { category: 'azure-apim',              status: 'wip',    featured: false, mcp: [] },
  'apim-policy-authoring':        { category: 'azure-apim',              status: 'wip',    featured: false, mcp: [] },
  'apiops-deployment':            { category: 'azure-apim',              status: 'wip',    featured: false, mcp: [] },
  'apm-package-author':           { category: 'github-workflows',        status: 'stable', featured: false, mcp: [] },
  'architecture-design':          { category: 'azure-architecture',      status: 'stable', featured: true,  mcp: ['Azure MCP'] },
  'azure-apim-architecture':      { category: 'azure-apim',              status: 'wip',    featured: false, mcp: [] },
  'azure-drawio-mcp-diagramming': { category: 'diagramming',             status: 'stable', featured: true,  mcp: ['Draw.io MCP'] },
  'azure-pricing':                { category: 'azure-architecture',      status: 'stable', featured: true,  mcp: ['Azure MCP'] },
  'cost-optimization':            { category: 'azure-architecture',      status: 'wip',    featured: false, mcp: ['Azure MCP'] },
  'drawio-mcp-diagramming':       { category: 'diagramming',             status: 'stable', featured: false, mcp: ['Draw.io MCP'] },
  'excalidraw-mcp-diagramming':   { category: 'diagramming',             status: 'stable', featured: false, mcp: ['Excalidraw MCP'] },
  'gh-aw-operations':             { category: 'github-workflows',        status: 'stable', featured: true,  mcp: [] },
  'terraform-provider-upgrade':   { category: 'infrastructure-as-code',  status: 'stable', featured: true,  mcp: ['Terraform MCP'] },
  'waf-assessment':               { category: 'azure-architecture',      status: 'stable', featured: true,  mcp: ['Azure MCP'] },
};

export interface AgentMeta {
  skills: string[];
  package: string | null;
}

export const agentMeta: Record<string, AgentMeta> = {
  'apim-policy-author':         { skills: ['apim-policy-authoring'],                                                        package: null },
  'azure-architect':            { skills: ['architecture-design', 'waf-assessment', 'cost-optimization', 'azure-pricing'],  package: 'architect' },
  'gh-aw-builder':              { skills: ['gh-aw-operations'],                                                              package: 'terraform' },
  'terraform-provider-upgrade': { skills: ['terraform-provider-upgrade'],                                                   package: 'terraform' },
};

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
