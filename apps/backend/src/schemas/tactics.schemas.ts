import { z } from 'zod';

const playerSchema = z.object({
  id: z.number(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  number: z.number().min(1).max(11),
  name: z.string().optional(),
  position: z.string().optional(),
  isCaptain: z.boolean().optional(),
  hasYellowCard: z.boolean().optional(),
  hasRedCard: z.boolean().optional(),
  isStarPlayer: z.boolean().optional(),
});

// 3- or 6-digit hex — the dark-field preset uses "#222"
const hexColor = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);

const fieldSettingsObject = z.object({
  fieldColor: hexColor,
  playerColor: hexColor,
  showPlayerLabels: z.boolean(),
  markerType: z.enum(['circle', 'shirt']),
});

const fieldSettingsSchema = fieldSettingsObject.optional();

const arrowSchema = z.object({
  id: z.string(),
  type: z.enum([
    'pass',
    'dribble',
    'long-ball',
    'target-zone',
    'direct-run',
    'secondary-run',
    'curved-run',
    'press-run',
  ]),
  points: z
    .array(z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }))
    .min(1)
    .max(2),
  color: z.string().optional(),
  endsAtPlayer: z.boolean().optional(),
});

const keyframeSchema = z.object({
  id: z.string().uuid(),
  timeMs: z.number().min(0),
  players: z.array(playerSchema).length(11),
  fieldSettings: fieldSettingsObject,
  oppositionPlayers: z.array(playerSchema).length(11).optional(),
  label: z.string().optional(),
});

const pitchPoint = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

/**
 * Gesture-authored movement. The client compiles these into `keyframes`, which
 * is still the only thing playback and MP4 export read — these ride along so a
 * tactic reopens as editable gestures rather than opaque keyframes.
 */
const movementSchema = z.object({
  id: z.string(),
  target: z.union([
    z.object({
      kind: z.literal('player'),
      team: z.enum(['home', 'away']),
      playerId: z.number(),
    }),
    z.object({ kind: z.literal('ball') }),
  ]),
  // Two points is a straight run; more carry curvature. The cap stops a
  // pathological drag from persisting thousands of samples.
  path: z.array(pitchPoint).min(2).max(64),
  cycle: z.enum(['out-and-back', 'loop']),
  repeats: z.number().int().min(1).max(12),
  tempo: z.enum(['jog', 'run', 'sprint']),
  delay: z.number().min(0).max(1),
});

const animationDataSchema = z.object({
  durationMs: z.number().min(500).max(60000),
  fps: z.number().int().min(1).max(60),
  keyframes: z.array(keyframeSchema),
  movements: z.array(movementSchema).max(23).optional(),
  loop: z.boolean().optional(),
}).optional();

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
    fieldSettings: fieldSettingsSchema,
    animation: animationDataSchema,
    oppositionPlayers: z.array(playerSchema).length(11).nullable().optional(),
    oppositionFieldSettings: fieldSettingsObject.nullable().optional(),
    arrows: z.array(arrowSchema).nullable().optional(),
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
    fieldSettings: fieldSettingsSchema,
    animation: animationDataSchema,
    oppositionPlayers: z.array(playerSchema).length(11).nullable().optional(),
    oppositionFieldSettings: fieldSettingsObject.nullable().optional(),
    arrows: z.array(arrowSchema).nullable().optional(),
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
