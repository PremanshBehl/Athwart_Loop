import { z } from 'zod';

export const createPostSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(300, 'Title too long (max 300)'),
    description: z.string().min(1, 'Description is required').max(20_000, 'Description too long (max 20,000)'),
    type: z.enum(['QUESTION', 'PROBLEM', 'IDEA']),
    section: z.enum(['BILLS', 'INVOICING', 'PATIENTS', 'CASES', 'PARTNERS', 'HOSPITALS', 'DOCTORS', 'WHATSAPP', 'PLATFORM', 'GENERAL']),
    isUseCase: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
    linkedEntityType: z.enum(['BILL', 'CASE', 'PARTNER']).optional(),
    linkedEntityId: z.string().max(64, 'Reference ID too long').optional(),
    departmentId: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().positive().optional().nullable()),
    campaignId: z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : Number(val)), z.number().int().positive().optional()),
    assigneeId: z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : Number(val)), z.number().int().positive().optional()),
  }).strict()
}).refine(data => data.body.type === 'IDEA' || data.body.assigneeId, {
  message: "Assignee is required for this post type",
  path: ["body", "assigneeId"],
});

export const updatePostStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be numeric'),
  }).strict(),
  body: z.object({
    status: z.enum(['OPEN', 'DISCUSSING', 'RESOLVED']).optional(),
    assigneeId: z.number().int().positive().optional().nullable(),
    resolution: z.enum(['ANSWERED', 'FIXED', 'APPROVED', 'PARKED', 'DECLINED', 'DUPLICATE', 'RULE_DECIDED']).optional(),
    resolutionReason: z.string().optional(),
    // Handbook C6: optional GitHub-issue handoff link — validated as URL when present.
    buildIssueUrl: z.string().url('Must be a valid URL').optional().nullable(),
    // Handbook D2: when resolving a Question, the owner can post the canonical
    // answer inline. It becomes a comment with isCanonical=true.
    canonicalAnswer: z.string().min(1).max(5000).optional(),
  }).strict()
});

export const reactToPostSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be numeric'),
  }).strict(),
  body: z.object({
    emoji: z.string().min(1, 'Emoji is required').max(10, 'Emoji too long'),
  }).strict()
});

export const updatePostSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be numeric'),
  }).strict(),
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(300).optional(),
    description: z.string().min(1, 'Description is required').max(20_000).optional(),
    type: z.enum(['QUESTION', 'PROBLEM', 'IDEA']).optional(),
    section: z.enum(['BILLS', 'INVOICING', 'PATIENTS', 'CASES', 'PARTNERS', 'HOSPITALS', 'DOCTORS', 'WHATSAPP', 'PLATFORM', 'GENERAL']).optional(),
    isUseCase: z.preprocess((val) => {
      if (val === undefined || val === null) return undefined;
      return val === 'true' || val === true;
    }, z.boolean().optional()),
    linkedEntityType: z.enum(['BILL', 'CASE', 'PARTNER']).optional(),
    linkedEntityId: z.string().max(64, 'Reference ID too long').optional(),
    departmentId: z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : Number(val)), z.number().int().positive().optional().nullable()),
    removeAttachmentId: z.preprocess((val) => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val.map(Number);
      return Number(val);
    }, z.union([z.number().int().positive(), z.array(z.number().int().positive())]).optional()),
  }).strict(),
});
