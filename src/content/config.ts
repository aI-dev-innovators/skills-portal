import { defineCollection, z } from 'astro:content';

const skills = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    title: z.string(),
    description: z.string(),
    version: z.string().optional(),
    tags: z.array(z.string()).default([]),
    frameworks: z.array(z.string()).default([]),
    testTypes: z.array(z.string()).default([]),
    level: z.string().optional(),
    status: z.string().optional(),
    estimatedTime: z.number().nullable().optional(),
    hasExamples: z.boolean().optional(),
    hasTemplates: z.boolean().optional(),
    hasEvals: z.boolean().optional(),
    hasScripts: z.boolean().optional(),
    recommendedCommands: z.array(z.string()).default([]),
    repoId: z.string().optional(),
    repoName: z.string().optional()
  })
});

const repos = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    repoUrl: z.string().optional(),
    defaultBranch: z.string().optional()
  })
});

export const collections = { skills, repos };
