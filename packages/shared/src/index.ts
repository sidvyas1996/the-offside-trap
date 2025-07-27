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
  image_url?: string | null;
  title: string;
  formation: string;
  tags: string[];
  description: string;
  players: Player[];
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