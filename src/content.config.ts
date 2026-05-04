import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.string().default('Home Selling'),
    author: z.string().optional(),
    reviewer: z.string().optional(),
    heroImage: z.string().optional(),
    readingTime: z.number().optional(),
  }),
});

export const collections = { blog };
