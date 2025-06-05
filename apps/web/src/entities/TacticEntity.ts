import type {
  Tactic,
  ApiResponse,
  TacticListResponse,
  TacticFilters,
  TacticDetailResponse,
  Comment,
  CommentListResponse,
} from "../../../../packages/shared";

import axios from "axios";
import { AuthTokenStore } from "./AuthTokenStore.ts";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
api.interceptors.request.use((config) => {
  const jwt = AuthTokenStore.getToken();
  console.log("jwt", jwt);
  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
  }
  return config;
});

export class TacticEntity {
  static async list(params?: TacticFilters) {
    try {
      console.log("params", params);
      const searchParams = new URLSearchParams();

      if (params) {
        if (params.formation)
          searchParams.append("formation", params.formation);
        if (params.tags && params.tags.length > 0) {
          params.tags.forEach((tag) => searchParams.append("tags[]", tag));
        }
        if (params.search) searchParams.append("search", params.search);
        if (params.sortBy) searchParams.append("sortBy", params.sortBy);
        if (params.timeRange)
          searchParams.append("timeRange", params.timeRange);
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
      }

      const { data } = await api.get<ApiResponse<TacticListResponse>>(
        `/tactics?${searchParams.toString()}`,
      );

      if (!data.success || !data.data) {
        throw new Error(data.error || "Failed to fetch tactics");
      }

      return data.data.tactics;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error("Tactics not found");
        }
        throw new Error(`HTTP error! status: ${error.response?.status}`);
      }

      console.error("Error fetching tactics:", error);
      throw error;
    }
  }

  static async getById(id: string) {
    try {
      const { data } = await api.get<ApiResponse<TacticDetailResponse>>(
        `/tactics/${id}`,
      );

      if (!data.success || !data.data) {
        throw new Error(data.error || "Failed to fetch tactic");
      }

      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error("Tactic not found");
        }
        throw new Error(`HTTP error! status: ${error.response?.status}`);
      }

      console.error("Error fetching tactic:", error);
      throw error;
    }
  }

  async create(tacticData: Partial<Tactic>): Promise<Tactic> {
    try {
      const { data } = await api.post<ApiResponse<Tactic>>(
        "/tactics",
        tacticData,
      );

      if (!data.success || !data.data) {
        throw new Error(data.error || "Failed to create tactic");
      }

      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          throw new Error("Invalid tactic data");
        }
        throw new Error(`HTTP error! status: ${error.response?.status}`);
      }

      console.error("Error creating tactic:", error);
      throw error;
    }
  }

  async update(id: string, tacticData: Partial<Tactic>): Promise<Tactic> {
    try {
      const { data } = await api.put<ApiResponse<Tactic>>(
        `/tactics/${id}`,
        tacticData,
      );

      if (!data.success || !data.data) {
        throw new Error(data.error || "Failed to update tactic");
      }

      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error("Tactic not found");
        }
        if (error.response?.status === 400) {
          throw new Error("Invalid tactic data");
        }
        throw new Error(`HTTP error! status: ${error.response?.status}`);
      }

      console.error("Error updating tactic:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { data } = await api.delete<ApiResponse<void>>(`/tactics/${id}`);

      if (!data.success) {
        throw new Error(data.error || "Failed to delete tactic");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error("Tactic not found");
        }
        throw new Error(`HTTP error! status: ${error.response?.status}`);
      }

      console.error("Error deleting tactic:", error);
      throw error;
    }
  }

  static async addComment(tacticId: string, content: string) {
    try {
      const { data } = await api.post<ApiResponse<Comment>>(
        `/tactics/${tacticId}/comment`,
        { content },
      );

      if (!data.success || !data.data) {
        throw new Error(data.error || "Failed to add comment");
      }

      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          throw new Error("Invalid tactic data");
        }
        throw new Error(`HTTP error! status: ${error.response?.status}`);
      }

      console.error("Error adding comment:", error);
      throw error;
    }
  }

  static async getComments(tacticId: string) {
    try {
      const { data } = await api.get<ApiResponse<CommentListResponse>>(
        `/tactics/${tacticId}/comments`,
      );

      if (!data.success || !data.data) {
        throw new Error(data.error || "Failed to get comments");
      }

      return data.data.comments;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          throw new Error("Invalid tactic data");
        }
        throw new Error(`HTTP error! status: ${error.response?.status}`);
      }

      console.error("Error getting comments:", error);
      throw error;
    }
  }

  static async likeToggle(tacticId: string) {
    try {
      const { data } = await api.post<ApiResponse<{ isLiked: boolean }>>(
        `/tactics/${tacticId}/like`,
      );

      if (!data.success || !data.data) {
        throw new Error(data.error || "Failed to get comments");
      }
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          throw new Error("Invalid tactic data");
        }
        throw new Error(`HTTP error! status: ${error.response?.status}`);
      }

      console.error("Error liking tactics:", error);
      throw error;
    }
  }

  static async getLikeCount(tacticId: string) {
    try {
      const { data } = await api.get<ApiResponse<{ total: number }>>(
        `/tactics/${tacticId}/likes`,
      );

      if (!data.success || !data.data) {
        throw new Error(data.error || "Failed to get comments");
      }

      return data.data.total;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          throw new Error("Invalid request for getting like count");
        }
        throw new Error(`HTTP error! status: ${error.response?.status}`);
      }
      console.error("Error getting comments:", error);
      throw error;
    }
  }
}
