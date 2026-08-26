export interface Player {
  id: number;
  x: number;
  y: number;
  number: number;
  name?: string;
  position?: string;
  isCaptain?: boolean;
  hasYellowCard?: boolean;
  hasRedCard?: boolean;
  isStarPlayer?: boolean;
}



export interface TacticSummary {
  id: string;
  image_url?: string | null;
  title: string;
  formation: string;
  tags: string[];
  stats: TacticStats;
  /**
   * Optional because the *type* was written before the list endpoint returned it.
   * `tacticSummarySelect` does include the author, so it is present in practice —
   * declared here so clients can read it without a cast.
   *
   * What that select genuinely omits is `players`, `animation` and `arrows`, so a
   * list card cannot draw the tactic's real shape without fetching it by id.
   */
  author?: Author;
  createdAt: Date;
  updatedAt: Date;
}

export type MarkerDesign = 'solid' | 'stripes' | 'diagonal-left' | 'diagonal-right' | 'horizontal-split' | 'vertical-split';

// Ball position on the field (0-100 percentage coords, same space as Player x/y)
export interface Ball {
  x: number;
  y: number;
  /**
   * How far off the ground the ball is: 0 on the deck, 1 at the top of its arc.
   *
   * The pitch is drawn in plan view, so there is no "up" to move into — height is
   * conveyed by the ball growing and its shadow separating beneath it. Lofted
   * passes set this; everything else leaves it absent.
   */
  lift?: number;
}

// Arrow annotation types
export type ArrowType =
  | 'pass'           // dashed line + open arrowhead (ball)
  | 'dribble'        // zigzag solid line (ball carry)
  | 'long-ball'      // curved line + arrowhead (lofted pass / cross)
  | 'target-zone'    // X marker at a location
  | 'direct-run'     // straight solid arrow (player run)
  | 'secondary-run'  // dashed solid arrow (conditional run)
  | 'curved-run'     // curved solid arrow (overlap / arc run)
  | 'press-run';     // zigzag arrow (pressing run)

export interface TacticArrow {
  id: string;
  type: ArrowType;
  points: { x: number; y: number }[]; // 0-100 percentage coords; target-zone has 1 pt, all others have 2
  color?: string;
  endsAtPlayer?: boolean; // ball arrows: skip end-clipping so arrowhead points to player centre

  // --- Motion. An arrow is the notation *and* the animation. -----------------
  /**
   * Running order. Arrows sharing a beat move together; beats play in order.
   * Absent means beat 1. This single number is what makes parallel and
   * sequential the same mechanism rather than two.
   */
  beat?: number;
  /** Overrides the tempo implied by the arrow type. */
  tempo?: MovementTempo;
  /**
   * Who the arrow starts and ends on, bound when it is drawn.
   *
   * Resolving by proximity at compile time alone would orphan an arrow the
   * moment its player is repositioned; the ref is also what lets a run
   * re-anchor to the player's live position, which is what a diagram implies.
   */
  from?: { team: 'home' | 'away'; playerId: number };
  to?: { team: 'home' | 'away'; playerId: number };
}

// Field visual settings (CreateTactics / 2D field only)
export interface FieldSettings {
  fieldColor: string;
  playerColor: string;
  showPlayerLabels: boolean;
  markerType: 'circle' | 'shirt';
  // Marker color/design customization
  markerBgColor?: string;
  markerBorderColor?: string;
  markerTextColor?: string;
  markerSecondaryColor?: string;
  markerDesign?: MarkerDesign;
  // View settings
  fieldOfViewMode?: boolean;
  // Ball marker position; rides in fieldSettings so it persists and animates with keyframes
  ball?: Ball;
}

// Single keyframe snapshot
export interface Keyframe {
  id: string;           // uuid, client-generated
  timeMs: number;       // position on timeline in ms
  players: Player[];    // full 11-player snapshot
  fieldSettings: FieldSettings;
  oppositionPlayers?: Player[];
  label?: string;
}

/** How fast the object covers its path. Football words, not milliseconds. */
export type MovementTempo = 'jog' | 'run' | 'sprint';

/**
 * One repeating motion, authored by dragging on the pitch.
 *
 * A movement is deliberately *cyclic*: it always finishes where it started, so
 * a whole animation loops seamlessly without the author having to think about
 * it. That is the property that lets the studio drop keyframes entirely.
 *
 * There is only one shape here, not one-per-gesture. "Run", "shuttle" and
 * "circuit" are readings of `cycle` + `repeats`, derived for display by
 * describeMovement() — never stored. Adding a new gesture should mean teaching
 * the recognizer a new reading, not widening this type.
 */
export interface Movement {
  id: string;
  /** Which object moves. The ball rides in fieldSettings, so it is its own case. */
  target:
    | { kind: 'player'; team: 'home' | 'away'; playerId: number }
    | { kind: 'ball' };
  /** Waypoints in 0-100 pitch pct. path[0] is the object's resting position. */
  path: { x: number; y: number }[];
  /**
   * 'out-and-back' retraces the path; 'loop' runs a closed circuit; 'one-way'
   * travels A→B and *holds* B until the sequence resets.
   *
   * One-way is what sequential beats need: a striker who runs into the box in
   * beat 1 has to still be there in beat 2 for the cross to reach him. Returning
   * home is then a single shared reset at the end of the loop rather than
   * something each movement does on its own.
   */
  cycle: 'out-and-back' | 'loop' | 'one-way';
  /**
   * The span of the loop this movement travels in, as loop fractions — how a
   * beat is expressed. Before it the object holds path[0]; after it, the end of
   * its path when one-way. Non-wrapping only (start < end).
   *
   * When set, the window *is* the timing: `delay` and `tempo` no longer apply,
   * because the beat already says when and for how long.
   */
  window?: { start: number; end: number };
  /** 1 = a single run and recover. 2+ = a shuttle. */
  repeats: number;
  tempo: MovementTempo;
  /** Phase offset as a fraction of the loop; keeps players out of lockstep. */
  delay: number;
  /**
   * Ties this movement to a moment in the passing move, deriving `delay` from it.
   *
   * Absent means the movement runs from the start of every loop — simultaneous
   * with everything else, which is the common case and stays the default.
   */
  cue?: MovementCue;
  /** @deprecated Superseded by `cue`; read as `{ node, on: 'meet' }`. */
  syncToPassNode?: number;
}

export type CueRelation =
  /** Arrive at the same moment the ball does — a run onto a pass. */
  | 'meet'
  /** Set off when the ball arrives at that node. */
  | 'reaches'
  /** Set off when the ball is played onward from that node. */
  | 'leaves';

/**
 * When a movement fires, relative to the passing move.
 *
 * The *link* is stored rather than the resulting delay, on purpose: changing the
 * loop length or inserting an earlier pass would otherwise leave the runner
 * silently drifting out of step with the ball.
 */
export interface MovementCue {
  /** Index into PassSequence.nodes. */
  node: number;
  on: CueRelation;
}

/** How the ball reached a node. */
export type PassLegKind = 'pass' | 'dribble';

/**
 * One point in a passing move.
 *
 * Passes are deliberately *not* Movements. A player's movement is cyclic —
 * shuttle, circuit, repeats, tempo — whereas a passing move is an ordered chain
 * of one-off events. Forcing the ball into Movement is what limited a tactic to
 * a single ball action, because one-movement-per-object collapsed every ball
 * drag into the same slot.
 *
 * As with movements, everything here is read off the gesture: a leg that ends on
 * a marker is a pass to feet, one that ends in space is a through ball, and
 * dragging the player who is standing on the ball is a carry.
 */
export interface PassNode {
  /** Where the ball arrives, in 0-100 pitch pct. */
  at: { x: number; y: number };
  /** How the ball got here. nodes[0] is where the ball starts, so it has none. */
  via?: PassLegKind;
  /** Intermediate points, so a curled pass or a weaving carry keeps its shape. */
  bend?: { x: number; y: number }[];
  /**
   * Who receives here. Absent on a non-first node means it was played into
   * space — a through ball — which is what puts a ghost ball on the pitch.
   */
  receiver?: { team: 'home' | 'away'; playerId: number };
  /** 'dribble' only: who carries the ball along this leg. */
  carrier?: { team: 'home' | 'away'; playerId: number };
  /** The ball leaves the ground on this leg — a lofted pass or cross. */
  lofted?: boolean;
  /**
   * How long the ball waits here, and how long it took to get here, both in
   * milliseconds as actually drawn.
   *
   * Deliberately real durations rather than loop fractions: the compiler treats
   * them as *relative weights* and rescales them to fill the loop, so a chain
   * keeps its rhythm when the loop length changes. Storing fractions instead
   * would mean a leg drawn over 2s in a 5s loop could not be expressed at all
   * once the loop shrank, and it would make these incomparable with the
   * distance-derived fallback used for chains that carry no timing.
   */
  holdMs?: number;
  travelMs?: number;
}

export interface PassSequence {
  /** Ordered chain; nodes[0] is where the ball starts and returns to. */
  nodes: PassNode[];
  /**
   * Whether the move recycles back to nodes[0]. Defaults to true, because the
   * compiled animation has to open and close on the same pose for the loop (and
   * the exported MP4) to be seamless.
   */
  closed?: boolean;
}

// Full animation attached to a tactic
export interface AnimationData {
  durationMs: number;   // total duration, default 5000
  fps: number;          // export fps, default 24
  /**
   * Compiled output, and the only thing playback and MP4 export ever read.
   * Authored movements are compiled into this, which is why adding gestures
   * needed no change to the server-side exporter.
   */
  keyframes: Keyframe[];
  /** Authoring source of truth for players. Absent on pre-gesture tactics. */
  movements?: Movement[];
  /**
   * Authoring source of truth for the ball. When present this owns the ball
   * outright; a `movements` entry targeting the ball is legacy data from before
   * passes were their own type, and only used as a fallback.
   */
  passes?: PassSequence;
  /**
   * Derive the animation from the tactic's arrows.
   *
   * Absent means no — so tactics drawn before arrows carried motion keep their
   * arrows as static annotation and look exactly as they always did. A new tactic
   * turns it on, so drawing an arrow animates without hunting for a switch.
   */
  fromArrows?: boolean;
  /**
   * Loop fraction at which everything that moved eases back to where it started.
   * Shared by every object so the reset reads as one movement and the loop closes.
   */
  resetStart?: number;
  /** Repeat forever on screen. Defaults to true. */
  loop?: boolean;
  /**
   * The compiled V2 phase state.
   *
   * Typed loosely here because `TacticState` is declared in ./tactic-v2, which
   * imports from this module — naming the type would close the cycle. Read it with
   * a cast; `schemaVersion` is what tells you it is V2.
   *
   * Redundant with `arrows` while arrows remain the authoring surface, but it is
   * what lets playback and export stop depending on stored keyframes.
   */
  tacticV2?: unknown;
}

// Tactic Form Data
export interface TacticFormData {
  title: string;
  formation: string;
  tags: string[];
  description: string;
  players: Player[];
  fieldSettings?: FieldSettings;
  animation?: AnimationData;
  // null = explicitly cleared (opposition removed / arrows erased); undefined = leave as-is
  oppositionPlayers?: Player[] | null;
  oppositionFieldSettings?: FieldSettings | null;
  arrows?: TacticArrow[] | null;
}

// User Types
export interface UserSummary {
  id: string;
  username: string;
  avatar?: string | null;
}

// Comment Types
export interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: UserSummary;
}

// Tactic Statistics
export interface TacticStats {
  likes: number;
  comments: number;
  saves: number;
  views?: number;
}

// User Interaction Flags
export interface UserInteraction {
  isLiked?: boolean;
  isSaved?: boolean;
  canEdit?: boolean;
}

// Main Tactic Types
export interface Tactic {
  id: string;
  image_url?: string | null;
  title: string;
  formation: string;
  tags: string[];
  description: string;
  players: Player[];
  fieldSettings?: FieldSettings | null;
  animation?: AnimationData | null;
  oppositionPlayers?: Player[] | null;
  oppositionFieldSettings?: FieldSettings | null;
  arrows?: TacticArrow[] | null;
  author: Author;
  createdAt: Date;
  updatedAt: Date;
}
export interface Author {
  id: string;
  username: string;
  avatar?: string | null;
}

// The primary response type returned by the API
export interface TacticSummaryResponse extends Omit<TacticSummary, 'authorId'> {
  stats: TacticStats;
  userInteraction?: UserInteraction;
}


// Tactic List Response
export interface TacticListResponse {
  tactics: TacticSummaryResponse[];
  pagination: {
    current: number;
    total: number;
    count: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Tactic Detail Response
export interface TacticDetailResponse extends Tactic {
  stats: TacticStats;
  comments?: Comment[];
}

// API Request Types
export interface CreateTacticRequest extends TacticFormData {}

export interface UpdateTacticRequest extends Partial<TacticFormData> {}

// Filter Types
export interface TacticFilters {
  formation?: string;
  tags?: string[];
  search?: string;
  sortBy?: 'trending' | 'featured' | 'latest';
  timeRange?: '1d' | '1w' | '1m' | '1y' | 'all';
  page?: number;
  limit?: number;
}


// Comment List type
export interface CommentListResponse {
  comments: Comment[];
  pagination: {
    current: number;
    total: number;
    count: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API Response Wrapper Type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** The role a user picks during onboarding. Mirrors the Prisma `UserProfile` enum. */
export type UserProfile = "COACH" | "MANAGER" | "PLAYER" | "FAN" | "ENTHUSIAST";

export const USER_PROFILES: readonly UserProfile[] = [
  "COACH",
  "MANAGER",
  "PLAYER",
  "FAN",
  "ENTHUSIAST",
] as const;

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string | null;
  /** null until the user completes the onboarding profile picker. */
  profile?: UserProfile | null;
}

export type TabValue = "trending" | "featured" | "latest";

// ---------------------------------------------------------------------------
// Pitch geometry, and the V2 phase-driven movement model.
//
// Everything above this line is the V1 (fraction-based) vocabulary, still read by
// saved tactics. V2 lives in its own modules and is re-exported here so both the
// app and the backend exporter reach it the same way.
// ---------------------------------------------------------------------------
export * from "./pitch-geometry";
export * from "./tactic-v2";
export * from "./compile-tactic";
export * from "./migrate-v1";

// ---------------------------------------------------------------------------
// Rendering helpers.
//
// Pure logic extracted so it can be shared rather than living inside a
// component: the pitch's view geometry and its markings-as-data, the arrow path
// maths, keyframe interpolation and the default rosters. apps/web still has its
// own copies of these inside components — folding those into these modules is
// the de-duplication step, and is what these exist for.
// ---------------------------------------------------------------------------
export * from "./pitch-view";
export * from "./arrow-geometry";
export * from "./interpolate";
export * from "./lineups";
