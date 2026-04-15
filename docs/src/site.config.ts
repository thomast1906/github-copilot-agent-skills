// Website-only metadata overlaying source file data.
// This is the single source of truth for display-only fields.

export type SkillCategory =
  | 'azure-architecture'
  | 'azure-apim'
  | 'infrastructure-as-code'
  | 'diagramming'
  | 'github-workflows';

export type SkillStatus = 'stable' | 'wip';

export interface McpServer {
  id: string;
  name: string;
  description: string;
  installation: string;
  mcpJson: string;
  skills: string[];
  required: boolean;
}

export const mcpServers: McpServer[] = [
  {
    id: 'azure-mcp',
    name: 'Azure MCP',
    description: 'Connects GitHub Copilot to your Azure subscriptions for live pricing, resource queries, and architecture recommendations.',
    installation: 'Install the Azure Tools VS Code extension — the Azure MCP Server registers automatically.',
    mcpJson: `{
  "servers": {
    "azure": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@azure/mcp@latest", "server", "start"]
    }
  }
}`,
    skills: ['architecture-design', 'waf-assessment', 'cost-optimization', 'azure-pricing'],
    required: false,
  },
  {
    id: 'drawio-mcp',
    name: 'Draw.io MCP',
    description: 'Enables Copilot to create and edit Draw.io diagrams with full access to Azure icon libraries.',
    installation: 'Install the Draw.io integration VS Code extension and enable MCP in VS Code settings.',
    mcpJson: `{
  "servers": {
    "drawio": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "drawio-mcp-server@latest"]
    }
  }
}`,
    skills: ['azure-drawio-mcp-diagramming', 'drawio-mcp-diagramming'],
    required: false,
  },
  {
    id: 'excalidraw-mcp',
    name: 'Excalidraw MCP',
    description: 'Enables Copilot to create hand-drawn style architecture sketches using Excalidraw.',
    installation: 'Install the Excalidraw VS Code extension and configure the MCP server in your Copilot settings.',
    mcpJson: `{
  "servers": {
    "excalidraw": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "excalidraw-mcp-server@latest"]
    }
  }
}`,
    skills: ['excalidraw-mcp-diagramming'],
    required: false,
  },
  {
    id: 'terraform-mcp',
    name: 'Terraform MCP',
    description: 'Gives Copilot access to Terraform registry documentation for provider version analysis and upgrade planning.',
    installation: 'Install HashiCorp Terraform extension and enable the Terraform MCP server integration.',
    mcpJson: `{
  "servers": {
    "terraform": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@hashicorp/terraform-mcp-server@latest"]
    }
  }
}`,
    skills: ['terraform-provider-upgrade'],
    required: false,
  },
];
