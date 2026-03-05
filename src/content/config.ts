import { defineCollection, z } from 'astro:content';

const skills = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    title: z.string(),
    description: z.string(),
    version: z.string().optional(),
    tags: z.array(z.string()).default([]),
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
