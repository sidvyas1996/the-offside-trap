import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api.ts";

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => void;
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

  const fetchUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const res = await api.get("/users/me");
      setUser(res.data.data);
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setUser(null);
      clearTokens();
    }
  };

  // Refresh token logic
  const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await api.post("/auth/refresh", { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = res.data.token;
      setTokens(accessToken, newRefreshToken);
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
    await fetchUser();
  };

  const signUp = async (email: string, password: string, username: string) => {
    const res = await api.post("/auth/register", { email, password, username });
    const { accessToken, refreshToken } = res.data.token;
    setTokens(accessToken, refreshToken);
    await fetchUser();
  };

  const signOut = () => {
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
