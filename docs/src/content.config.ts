import { defineCollection, z } from 'astro:content';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import matter from 'gray-matter';
import yaml from 'yaml';
import { skillMeta, agentMeta, packageMeta } from './site.config';

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
        const overlay = skillMeta[slug] ?? {
          category: 'azure-architecture' as const,
          status: 'stable' as const,
          featured: false,
          mcp: [] as string[],
        };
        store.set({
          id: slug,
          data: {
            name: data.name as string,
            description: data.description as string,
            category: overlay.category,
            status: overlay.status,
            featured: overlay.featured,
            mcp: overlay.mcp,
          },
          body: content,
        });
      }
    },
  },
  schema: z.object({
    name: z.string(),
    description: z.string(),
    category: z.enum(['azure-architecture', 'azure-apim', 'infrastructure-as-code', 'diagramming', 'github-workflows']),
    status: z.enum(['stable', 'wip']),
    featured: z.boolean(),
    mcp: z.array(z.string()),
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
        const overlay = agentMeta[id] ?? { skills: [] as string[], package: null };
        store.set({
          id,
          data: {
            name: data.name as string,
            description: data.description as string,
            tools: (data.tools as string[]) ?? [],
            skills: overlay.skills,
            package: overlay.package,
          },
          body: content,
        });
      }
    },
  },
  schema: z.object({
    name: z.string(),
    description: z.string(),
    tools: z.array(z.string()),
    skills: z.array(z.string()),
    package: z.string().nullable(),
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
        const mcpNames: string[] = (data.dependencies?.mcp ?? []).map((m: { name: string }) => m.name);
        const overlay = packageMeta[id] ?? { featured: false };
        store.set({
          id,
          data: {
            name: data.name as string,
            description: typeof data.description === 'string' ? data.description.trim() : String(data.description).trim(),
            version: data.version as string,
            agents: agentIds,
            skills: skillIds,
            mcp: mcpNames,
            featured: overlay.featured,
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
