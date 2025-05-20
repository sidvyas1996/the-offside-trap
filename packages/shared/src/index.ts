export interface Player {
  id: number;
  x: number;
  y: number;
  number: number;
}

export interface PlayerPosition {
  id: number;
  x: number;
  y: number;
  number: number;
  role?: string; // Optional position role (e.g., "GK", "CB", "CAM")
}

// Tactic Form Data
export interface TacticFormData {
  title: string;
  formation: string;
  tags: string[];
  description: string;
  players: Player[];
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
  title: string;
  formation: string;
  tags: string[];
  description: string;
  players: Player[];
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

// The primary response type returned by the API
export interface TacticResponse extends Omit<Tactic, 'authorId'> {
  author: UserSummary;
  stats: TacticStats;
  userInteraction?: UserInteraction;
}

// Tactic List Response
export interface TacticListResponse {
  tactics: TacticResponse[];
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
export interface TacticDetailResponse extends TacticResponse {
  comments?: Comment[];
  similarTactics?: TacticResponse[];
}

// API Request Types
export interface CreateTacticRequest extends TacticFormData {}

export interface UpdateTacticRequest extends Partial<TacticFormData> {}

// Filter Types
export interface TacticFilters {
  formation?: string;
  tags?: string[];
  search?: string;
  sortBy?: 'recent' | 'popular' | 'trending';
  timeRange?: '1d' | '1w' | '1m' | '1y' | 'all';
  page?: number;
  limit?: number;
}

// API Response Wrapper Type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}