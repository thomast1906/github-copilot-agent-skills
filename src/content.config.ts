import { defineCollection, z } from 'astro:content';

const skills = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    category: z.enum([
      'azure-architecture',
      'azure-apim',
      'infrastructure-as-code',
      'diagramming',
      'github-workflows'
    ]),
    status: z.enum(['stable', 'wip']),
    mcp: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

const agents = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    file: z.string(),
    skills: z.array(z.string()),
    package: z.string().nullable(),
  }),
});

const packages = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    installCommand: z.string(),
    agents: z.array(z.string()).default([]),
    skills: z.array(z.string()),
    mcp: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

const mcpServers = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    setup: z.string(),
    skills: z.array(z.string()),
    required: z.boolean().default(false),
  }),
});

export const collections = { skills, agents, packages, 'mcp-servers': mcpServers };
