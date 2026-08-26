import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api.ts";
import type { User, UserProfile } from "../../../../packages/shared";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User | null>;
  signUp: (email: string, password: string, username: string) => Promise<User | null>;
  signOut: () => void;
  /** Patches the signed-in user (onboarding username + profile) and syncs state. */
  updateMe: (patch: { username?: string; profile?: UserProfile }) => Promise<User>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

const TOKEN_KEY = "auth_token";
const REFRESH_KEY = "refresh_token";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);
  const setTokens = (access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  };
  const clearTokens = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  };

  const fetchUser = async (): Promise<User | null> => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const res = await api.get("/users/me");
      const fetched: User = res.data.data;
      setUser(fetched);
      return fetched;
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setUser(null);
      clearTokens();
      return null;
    }
  };

  // Refresh token logic
  const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await api.post("/auth/token-refresh", { refreshToken });
      // The endpoint returns a bare access token; the refresh token is not rotated.
      const accessToken: string = res.data.token;
      setTokens(accessToken, refreshToken);
      return true;
    } catch (err) {
      console.error("Failed to refresh token:", err);
      clearTokens();
      return false;
    }
  };

  // Axios response interceptor for 401
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (res) => res,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          getRefreshToken()
        ) {
          originalRequest._retry = true;
          const success = await refreshAccessToken();
          if (success) {
            originalRequest.headers.Authorization = `Bearer ${getToken()}`;
            return api(originalRequest);
          }
        }
        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  // On mount: try fetching user
  useEffect(() => {
    const initAuth = async () => {
      await fetchUser();
      setLoading(false);
    };
    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { accessToken, refreshToken } = res.data.token;
    setTokens(accessToken, refreshToken);
    return fetchUser();
  };

  const signUp = async (email: string, password: string, username: string) => {
    const res = await api.post("/auth/register", { email, password, username });
    const { accessToken, refreshToken } = res.data.token;
    setTokens(accessToken, refreshToken);
    return fetchUser();
  };

  const signOut = () => {
    clearTokens();
    setUser(null);
  };

  const updateMe = async (patch: { username?: string; profile?: UserProfile }) => {
    const res = await api.patch("/users/me", patch);
    const updated: User = res.data.data;
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, updateMe, refreshUser: fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
