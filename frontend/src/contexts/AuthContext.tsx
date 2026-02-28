import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { setTokenProvider } from '../api/client';

interface User {
  id: string;
  email: string;
  display_name: string;
  username: string;
  role: string;
  is_verified?: boolean;
}

interface FrontpageStoredUser {
  id?: number | string;
  username?: string;
  display_name?: string;
  role?: string;
  email?: string;
}

interface AuthApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  refreshUserInfo: () => Promise<void>;
  loginWithRedirect: () => void;
  logout: () => void;
  getAccessToken: () => Promise<string>;
}

const FRONTPAGE_AUTH_STORAGE_KEY = 'auth-storage';
const FRONTPAGE_LOGIN_PATH = '/login';

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
  refreshUserInfo: async () => undefined,
  loginWithRedirect: () => undefined,
  logout: () => undefined,
  getAccessToken: async () => {
    throw new Error('Not authenticated');
  },
});

export const useAuth = (): AuthContextType => useContext(AuthContext);

const readFrontpageToken = (): string | null => {
  const authStorage = localStorage.getItem(FRONTPAGE_AUTH_STORAGE_KEY);
  if (!authStorage) {
    return null;
  }

  try {
    const parsed = JSON.parse(authStorage) as { state?: { token?: string | null } };
    const token = parsed?.state?.token;
    return typeof token === 'string' && token.trim() !== '' ? token : null;
  } catch {
    return null;
  }
};

const readFrontpageUser = (): FrontpageStoredUser | null => {
  const authStorage = localStorage.getItem(FRONTPAGE_AUTH_STORAGE_KEY);
  if (!authStorage) {
    return null;
  }

  try {
    const parsed = JSON.parse(authStorage) as { state?: { user?: FrontpageStoredUser | null } };
    return parsed?.state?.user ?? null;
  } catch {
    return null;
  }
};

const buildApiUrl = (): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  const version = import.meta.env.VITE_API_VERSION || 'v1';
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/api/${version}/auth/current-user`;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => readFrontpageToken());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncTokenFromFrontpage = useCallback(() => {
    setToken(readFrontpageToken());
  }, []);

  const loginWithRedirect = useCallback(() => {
    window.location.href = FRONTPAGE_LOGIN_PATH;
  }, []);

  const logout = useCallback(() => {
    // LitRPG Studio must not clear shared frontpage auth storage.
    window.location.href = FRONTPAGE_LOGIN_PATH;
  }, []);

  const getAccessToken = useCallback(async (): Promise<string> => {
    if (!token) {
      throw new Error('Not authenticated');
    }
    return token;
  }, [token]);

  useEffect(() => {
    setTokenProvider(async () => {
      if (!token) {
        return null;
      }
      return token;
    });
  }, [token]);

  const refreshUserInfo = useCallback(async (): Promise<void> => {
    if (!token) {
      setUser(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const raw = await response.text();
      const result = raw ? (JSON.parse(raw) as AuthApiResponse<User>) : null;

      if (!response.ok || !result?.success || !result.data) {
        throw new Error(result?.message || result?.error || `Authentication check failed (${response.status})`);
      }

      const frontpageUser = readFrontpageUser();
      setUser({
        ...result.data,
        username: frontpageUser?.username || result.data.username,
        display_name: frontpageUser?.display_name || frontpageUser?.username || result.data.display_name,
        email: frontpageUser?.email || result.data.email,
        role: frontpageUser?.role || result.data.role,
      });
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err.message : 'Failed to validate session');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === FRONTPAGE_AUTH_STORAGE_KEY) {
        syncTokenFromFrontpage();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [syncTokenFromFrontpage]);

  useEffect(() => {
    syncTokenFromFrontpage();
    refreshUserInfo();
  }, [refreshUserInfo, syncTokenFromFrontpage]);

  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated: Boolean(token && user),
      isLoading,
      user,
      error,
      refreshUserInfo,
      loginWithRedirect,
      logout,
      getAccessToken,
    }),
    [error, getAccessToken, isLoading, loginWithRedirect, logout, refreshUserInfo, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
