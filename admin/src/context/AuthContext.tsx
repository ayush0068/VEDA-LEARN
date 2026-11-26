import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ApiError, UNAUTHORIZED_EVENT, clearToken, getToken, setToken, tokenIsRemembered } from '@/services/api';
import { changePassword, getMe, loginRequest } from '@/services/auth.service';
import type { AdminUser } from '@/types';
import type { AccessLevel, ModuleKey } from '@/types/team';

const RANK: Record<AccessLevel, number> = { none: 0, view: 1, edit: 2, full: 3 };

interface AuthContextValue {
  user: AdminUser | null;
  /** true only while a saved token is being checked on first load */
  loading: boolean;
  login: (input: { email: string; password: string; remember: boolean }) => Promise<void>;
  logout: () => void;
  /** true for the super admin (owner of the panel) */
  isSuper: boolean;
  /** does this admin have at least `level` in a module? (the super admin has everything) */
  can: (module: ModuleKey, level?: AccessLevel) => boolean;
  /** first sign-in: replaces the temporary password and keeps the admin signed in */
  setOwnPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  /** re-reads the admin (and what they may do) from the server */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(() => Boolean(getToken()));

  // restore the session on page load (only admins are allowed in)
  useEffect(() => {
    if (!getToken()) return;
    let active = true;
    getMe()
      .then((me) => {
        if (!active) return;
        if (me.role === 'admin') setUser(me);
        else clearToken();
      })
      .catch((err: unknown) => {
        // expired token -> sign out; if the server is just unreachable keep the token for next time
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) clearToken();
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // any API call that comes back 401 signs the admin out
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (input: { email: string; password: string; remember: boolean }) => {
    const { user: me, token } = await loginRequest(input);
    if (me.role !== 'admin') throw new ApiError('This account does not have admin access.', 403);
    setToken(token, input.remember);
    setUser(me);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const isSuper = Boolean(user?.admin?.isSuper);

  const can = useCallback(
    (module: ModuleKey, level: AccessLevel = 'view') => {
      const have = user?.admin?.permissions[module] ?? 'none';
      return RANK[have] >= RANK[level];
    },
    [user],
  );

  const refresh = useCallback(async () => {
    const me = await getMe();
    if (me.role === 'admin') setUser(me);
  }, []);

  const setOwnPassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const remember = tokenIsRemembered();
    const { token } = await changePassword({ currentPassword, newPassword, remember });
    setToken(token, remember);
    const me = await getMe();
    setUser(me);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout, isSuper, can, setOwnPassword, refresh }), [user, loading, login, logout, isSuper, can, setOwnPassword, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};