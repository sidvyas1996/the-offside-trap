import { z } from 'zod';

export const USER_PROFILES = ['COACH', 'MANAGER', 'PLAYER', 'FAN', 'ENTHUSIAST'] as const;

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be less than 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

export const updateMeSchema = z.object({
  body: z
    .object({
      username: usernameSchema.optional(),
      profile: z.enum(USER_PROFILES, { errorMap: () => ({ message: 'Invalid profile' }) }).optional(),
    })
    .refine(data => data.username !== undefined || data.profile !== undefined, {
      message: 'Nothing to update',
    }),
});

export const usernameAvailableSchema = z.object({
  query: z.object({
    username: usernameSchema,
  }),
});
