import { z } from 'zod';

const playerSchema = z.object({
  id: z.number(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  number: z.number().min(1).max(11),
});

export const createTacticSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title must be less than 100 characters'),
    formation: z.string().regex(/^\d+-\d+(-\d+)*$/, 'Invalid formation format'),
    tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed'),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(1000, 'Description must be less than 1000 characters'),
    players: z.array(playerSchema).length(11, 'Exactly 11 players required'),
  }),
});

export const updateTacticSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100).optional(),
    formation: z
      .string()
      .regex(/^\d+-\d+(-\d+)*$/)
      .optional(),
    tags: z.array(z.string()).max(5).optional(),
    description: z.string().min(10).max(1000).optional(),
    players: z.array(playerSchema).length(11).optional(),
  }),
});

export const tacticFiltersSchema = z.object({
  query: z.object({
    formation: z.string().optional(),
    tags: z.string().optional(), // comma-separated
    sortBy: z.enum(['recent', 'popular', 'trending']).optional(),
    timeRange: z.enum(['1d', '1w', '1m', '1y', 'all']).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});
