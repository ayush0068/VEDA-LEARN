import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { clearToken, getStoredToken, storeToken } from '@/services/api';
import type { ApiRequestError } from '@/services/api';
import { getMe, loginRequest, registerRequest } from '@/services/auth.service';
import type { LoginInput, RegisterInput } from '@/services/auth.service';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  /** true only while a saved token is being checked on first load */
  loading: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Keeps the signed-in user (JWT in localStorage / sessionStorage) for the whole app. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(() => Boolean(getStoredToken()));

  // restore the session on page load
  useEffect(() => {
    if (!getStoredToken()) {
      setLoading(false);
      return;
    }

    let active = true;
    getMe()
      .then((me) => {
        if (active) setUser(me);
      })
      .catch((err: ApiRequestError) => {
        // expired / invalid token -> sign out. If the server is just unreachable, keep the token for next time.
        if (err.status === 401 || err.status === 403) clearToken();
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const { user: me, token } = await loginRequest(input);
    storeToken(token, input.remember);
    setUser(me);
    return me;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { user: me, token } = await registerRequest(input);
    storeToken(token, true);
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}