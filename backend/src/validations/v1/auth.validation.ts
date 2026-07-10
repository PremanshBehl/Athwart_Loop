import { z } from 'zod';

// Public signup is intentionally NOT allowed to choose a role. Any role
// assignment must go through PATCH /api/auth/users/:id/role (admin-gated).
// New accounts default to the least-privileged section role and an Admin
// promotes from there.
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    bio: z.string().max(500).optional(),
  }).strict() // Reject unknown fields to prevent payload injection (incl. `role`)
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }).strict()
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80).optional(),
    bio: z.string().max(500).optional(),
    avatarUrl: z.string().url().max(2048).optional().nullable(),
  }).strict()
});

export const updateUserRoleSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be numeric'),
  }).strict(),
  body: z.object({
    role: z.enum(['ADMIN', 'FOUNDER', 'DEVOPS', 'FRONTEND', 'BACKEND', 'AI_ML']),
  }).strict(),
});
