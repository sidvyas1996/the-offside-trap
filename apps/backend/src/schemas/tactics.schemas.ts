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

/** Which player an arrow or pass node refers to. Ids are per-roster, so the team matters. */
const playerRef = z.object({
  team: z.enum(['home', 'away']),
  playerId: z.number(),
});

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

  // Motion: an arrow is the notation and the animation.
  /** Running order. Arrows sharing a beat move together. Absent = beat 1. */
  beat: z.number().int().min(1).max(32).optional(),
  tempo: z.enum(['jog', 'run', 'sprint']).optional(),
  /** Bound when drawn, so a run survives its player being repositioned. */
  from: playerRef.optional(),
  to: playerRef.optional(),
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
  cycle: z.enum(['out-and-back', 'loop', 'one-way']),
  /** A beat's span of the loop. Non-wrapping, so start < end. */
  window: z.object({
    start: z.number().min(0).max(1),
    end: z.number().min(0).max(1),
  }).optional(),
  repeats: z.number().int().min(1).max(12),
  tempo: z.enum(['jog', 'run', 'sprint']),
  delay: z.number().min(0).max(1),
  /**
   * Ties the movement to a moment in the passing move; `delay` is then derived.
   * Absent means it runs from the start of the loop, i.e. simultaneously.
   */
  cue: z.object({
    node: z.number().int().min(0).max(31),
    on: z.enum(['meet', 'reaches', 'leaves']),
  }).optional(),
  /** Superseded by `cue`, still accepted so older payloads keep working. */
  syncToPassNode: z.number().int().min(0).max(31).optional(),
});

/**
 * A passing move: an ordered chain of nodes, deliberately separate from
 * `movements` because a pass is a one-off event and a movement is cyclic.
 * Compiles into `keyframes` like everything else, so the exporter is unaffected.
 */
const passNodeSchema = z.object({
  at: pitchPoint,
  via: z.enum(['pass', 'dribble']).optional(),
  // Capped for the same reason as a movement's path: a pathological drag should
  // not be able to persist thousands of samples.
  bend: z.array(pitchPoint).max(32).optional(),
  receiver: playerRef.optional(),
  carrier: playerRef.optional(),
  /** The ball leaves the ground on this leg. */
  lofted: z.boolean().optional(),
  // Durations as drawn, in ms. The compiler treats them as relative weights and
  // rescales to fill the loop, so they are deliberately not loop fractions.
  holdMs: z.number().min(0).max(120000).optional(),
  travelMs: z.number().min(0).max(120000).optional(),
});

/**
 * Schema V2: a tactic as a sequence of phases, with time as an output.
 *
 * Validated rather than accepted as opaque JSON because zod strips unknown keys —
 * an unvalidated `tacticV2` would be silently dropped on save, which is far worse
 * than being rejected. Bounds mirror the V1 shapes above: 24 actors, and caps that
 * stop a pathological payload persisting thousands of points.
 */
const v2Destination = z.union([
  z.object({ kind: z.literal('point'), at: pitchPoint }),
  z.object({ kind: z.literal('actor'), actorId: z.string().max(24) }),
  z.object({ kind: z.literal('origin') }),
]);

const v2Action = z.object({
  id: z.string().max(64),
  actorId: z.string().max(24),
  to: v2Destination,
  via: z.array(pitchPoint).max(32).optional(),
  speed: z.enum(['walk', 'jog', 'run', 'sprint', 'pass', 'driven', 'lofted']).optional(),
  durationMs: z.number().min(0).max(120000).optional(),
  holdMs: z.number().min(0).max(120000).optional(),
  continuous: z.boolean().optional(),
  constraint: z.enum(['free', 'arrive-with-ball']).optional(),
  isLofted: z.boolean().optional(),
  repeat: z.number().int().min(1).max(12).optional(),
});

const tacticV2Schema = z.object({
  schemaVersion: z.literal(2),
  /** Every actor's absolute starting coordinate — the only absolute state. */
  initialBoard: z.record(z.string().max(24), pitchPoint),
  phases: z
    .array(
      z.object({
        id: z.string().max(64),
        holdMs: z.number().min(0).max(120000).optional(),
        actions: z.array(v2Action).max(46),
      }),
    )
    .max(24),
});

const animationDataSchema = z.object({
  durationMs: z.number().min(500).max(60000),
  fps: z.number().int().min(1).max(60),
  keyframes: z.array(keyframeSchema),
  movements: z.array(movementSchema).max(23).optional(),
  passes: z.object({
    nodes: z.array(passNodeSchema).max(32),
    closed: z.boolean().optional(),
  }).optional(),
  /** Derive the animation from the tactic's arrows. Absent = no, so old tactics stay static. */
  fromArrows: z.boolean().optional(),
  /** Loop fraction at which everything eases home, shared by every object. */
  resetStart: z.number().min(0).max(1).optional(),
  loop: z.boolean().optional(),
  /** The compiled phase state. Absent on every tactic saved before schema V2. */
  tacticV2: tacticV2Schema.optional(),
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
