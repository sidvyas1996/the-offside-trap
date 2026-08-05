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
  createdAt: Date;
  updatedAt: Date;
}

export type MarkerDesign = 'solid' | 'stripes' | 'diagonal-left' | 'diagonal-right' | 'horizontal-split' | 'vertical-split';

// Ball position on the field (0-100 percentage coords, same space as Player x/y)
export interface Ball {
  x: number;
  y: number;
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
  /** 'out-and-back' retraces the path; 'loop' runs a closed circuit. */
  cycle: 'out-and-back' | 'loop';
  /** 1 = a single run and recover. 2+ = a shuttle. */
  repeats: number;
  tempo: MovementTempo;
  /** Phase offset as a fraction of the loop; keeps players out of lockstep. */
  delay: number;
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
  /** Authoring source of truth. Absent on tactics made before gestures existed. */
  movements?: Movement[];
  /** Repeat forever on screen. Defaults to true. */
  loop?: boolean;
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

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string | null;
}

export type TabValue = "trending" | "featured" | "latest";