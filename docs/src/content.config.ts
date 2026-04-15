import { defineCollection, z } from 'astro:content';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import matter from 'gray-matter';
import yaml from 'yaml';

// Repo root: docs/src/content.config.ts → two levels up → repo root
const ROOT = fileURLToPath(new URL('../../', import.meta.url));

function parseApmDeps(deps: string[]): { agents: string[]; skills: string[] } {
  const agents: string[] = [];
  const skills: string[] = [];
  for (const dep of deps) {
    if (dep.includes('/agents/')) {
      agents.push(dep.split('/agents/')[1].replace('.agent.md', ''));
    } else if (dep.includes('/skills/')) {
      skills.push(dep.split('/skills/')[1]);
    }
  }
  return { agents, skills };
}

// Normalize raw apm.yml MCP names (e.g. "drawio") to site.config server IDs (e.g. "drawio-mcp")
const apmMcpIdMap: Record<string, string> = {
  'drawio':      'drawio-mcp',
  'excalidraw':  'excalidraw-mcp',
  'terraform':   'terraform-mcp',
  'azure':       'azure-mcp',
};

function normalizeMcpId(rawName: string): string {
  return apmMcpIdMap[rawName] ?? rawName;
}

function parseAzureServices(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return (raw as string[]).map(s => String(s).trim()).filter(Boolean);
  return String(raw).split(',').map(s => s.trim()).filter(Boolean);
}

const skills = defineCollection({
  loader: {
    name: 'skills-loader',
    load: async ({ store }) => {
      const skillsDir = join(ROOT, '.github', 'skills');
      for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const slug = entry.name;
        const skillPath = join(skillsDir, slug, 'SKILL.md');
        if (!existsSync(skillPath)) continue;
        const raw = readFileSync(skillPath, 'utf-8');
        const { data, content } = matter(raw);
        const meta = (data.metadata as Record<string, unknown>) ?? {};
        const rawMcp = (meta.mcp as string[] | undefined) ?? [];
        store.set({
          id: slug,
          data: {
            name: data.name as string,
            description: data.description as string,
            metadata: {
              examples: (meta.examples as string[]) ?? [],
              category: (meta.category as string) ?? 'azure-architecture',
              status: (meta.status as string) ?? 'stable',
              featured: (meta.featured as boolean) ?? false,
              mcp: Array.isArray(rawMcp) ? rawMcp : [],
              azureServices: parseAzureServices(meta['azure-services']),
              version: (meta.version as string | undefined) ?? undefined,
              lastUpdated: (meta['last-updated'] as string | undefined) ?? undefined,
            },
          },
          body: content,
        });
      }
    },
  },
  schema: z.object({
    name: z.string(),
    description: z.string(),
    metadata: z.object({
      examples: z.array(z.string()),
      category: z.enum(['azure-architecture', 'azure-apim', 'infrastructure-as-code', 'diagramming', 'github-workflows']),
      status: z.enum(['stable', 'wip']),
      featured: z.boolean(),
      mcp: z.array(z.string()),
      azureServices: z.array(z.string()).default([]),
      version: z.string().optional(),
      lastUpdated: z.string().optional(),
    }),
  }),
});

const agents = defineCollection({
  loader: {
    name: 'agents-loader',
    load: async ({ store }) => {
      const agentsDir = join(ROOT, '.github', 'agents');
      for (const file of readdirSync(agentsDir).filter((f: string) => f.endsWith('.agent.md'))) {
        const id = file.replace('.agent.md', '');
        const raw = readFileSync(join(agentsDir, file), 'utf-8');
        const { data, content } = matter(raw);
        const meta = (data.metadata as Record<string, unknown>) ?? {};
        store.set({
          id,
          data: {
            name: data.name as string,
            description: data.description as string,
            tools: (data.tools as string[]) ?? [],
            metadata: {
              examples: (meta.examples as string[]) ?? [],
              skills: (meta.skills as string[]) ?? [],
            },
          },
          body: content,
        });
      }
    },
  },
  schema: z.object({
    name: z.string(),
    description: z.string(),
    tools: z.array(z.string()).default([]),
    metadata: z.object({
      examples: z.array(z.string()).default([]),
      skills: z.array(z.string()).default([]),
    }),
  }),
});

const packages = defineCollection({
  loader: {
    name: 'packages-loader',
    load: async ({ store }) => {
      const pkgsDir = join(ROOT, 'packages');
      for (const entry of readdirSync(pkgsDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const id = entry.name;
        const apmPath = join(pkgsDir, id, 'apm.yml');
        if (!existsSync(apmPath)) continue;
        const data = yaml.parse(readFileSync(apmPath, 'utf-8'));
        const apmDeps: string[] = (data.dependencies?.apm ?? []);
        const { agents: agentIds, skills: skillIds } = parseApmDeps(apmDeps);
        const mcpIds: string[] = (data.dependencies?.mcp ?? []).map((m: { name: string }) => normalizeMcpId(m.name));
        store.set({
          id,
          data: {
            name: data.name as string,
            description: typeof data.description === 'string' ? data.description.trim() : String(data.description).trim(),
            version: data.version as string,
            agents: agentIds,
            skills: skillIds,
            mcp: mcpIds,
            featured: (data.featured as boolean) ?? false,
            installCommand: `apm install thomast1906/github-copilot-agent-skills/packages/${id} --runtime ${data.target ?? 'vscode'}`,
          },
        });
      }
    },
  },
  schema: z.object({
    name: z.string(),
    description: z.string(),
    version: z.string(),
    agents: z.array(z.string()),
    skills: z.array(z.string()),
    mcp: z.array(z.string()),
    featured: z.boolean(),
    installCommand: z.string(),
  }),
});

export const collections = { skills, agents, packages };
