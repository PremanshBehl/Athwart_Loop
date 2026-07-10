import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({
    postId: z.union([z.string(), z.number()]).transform(Number),
    content: z.string().min(1, 'Content is required').max(10_000, 'Content too long (max 10,000 chars)'),
    parentId: z.union([z.string(), z.number()]).optional().nullable().transform(val => val ? Number(val) : undefined),
  }).strict()
});

export const updateCommentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be numeric'),
  }).strict(),
  body: z.object({
    content: z.string().min(1, 'Content is required').max(10_000, 'Content too long (max 10,000 chars)').optional(),
    isCanonical: z.boolean().optional(),
  }).strict()
});
