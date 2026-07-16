// ─────────────────────────────────────────────────────────────────────────────
// ADMIN GUARD HOOK
// Dev mode    → validates against VITE_ADMIN_PIN when VITE_AUTH_MODE !== 'cognito'
// Production  → ALWAYS checks Cognito session for `admins` group membership
//               (import.meta.env.PROD is true → PIN fallback is NEVER available)
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react';

const MOCK_SESSION_KEY = 'pulari_admin_dev_session';
const ADMIN_PIN = (import.meta.env.VITE_ADMIN_PIN as string | undefined) ?? 'admin1234';

function isMockMode(): boolean {
  // Production builds (npm run build) ALWAYS use Cognito — no exceptions.
  if (import.meta.env.PROD) return false;
  // In dev, PIN mode is disabled if VITE_AUTH_MODE is explicitly set to 'cognito'.
  return (import.meta.env.VITE_AUTH_MODE as string | undefined) !== 'cognito';
}

export interface AdminGuardState {
  isAdmin: boolean;
  loading: boolean;
  username: string | null;
  login: (emailOrPin: string, password?: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

export function useAdminGuard(): AdminGuardState {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  const check = useCallback(async () => {
    setLoading(true);

    if (isMockMode()) {
      const stored = localStorage.getItem(MOCK_SESSION_KEY);
      if (stored === ADMIN_PIN) {
        setIsAdmin(true);
        setUsername('admin@pulari.ie');
      } else {
        setIsAdmin(false);
        setUsername(null);
      }
      setLoading(false);
      return;
    }

    // Production: verify Cognito session + admins group
    try {
      const { getCurrentUser, fetchAuthSession } = await import('aws-amplify/auth');
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      const groups: string[] =
        (session.tokens?.idToken?.payload?.['cognito:groups'] as string[]) ?? [];

      if (groups.includes('admins')) {
        setIsAdmin(true);
        setUsername(currentUser.username);
      } else {
        setIsAdmin(false);
        setUsername(null);
      }
    } catch {
      setIsAdmin(false);
      setUsername(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  const login = useCallback(async (emailOrPin: string, password?: string): Promise<string | null> => {
    if (isMockMode()) {
      if (emailOrPin === ADMIN_PIN) {
        localStorage.setItem(MOCK_SESSION_KEY, emailOrPin);
        setIsAdmin(true);
        setUsername('admin@pulari.ie');
        return null;
      }
      return 'Invalid admin PIN.';
    }

    // Production Cognito sign-in
    try {
      const { signIn, fetchAuthSession } = await import('aws-amplify/auth');
      await signIn({ username: emailOrPin, password: password ?? '' });

      const session = await fetchAuthSession();
      const groups: string[] =
        (session.tokens?.idToken?.payload?.['cognito:groups'] as string[]) ?? [];

      if (!groups.includes('admins')) {
        const { signOut } = await import('aws-amplify/auth');
        await signOut();
        return 'Your account does not have admin access.';
      }

      await check();
      return null;
    } catch (e: unknown) {
      return (e as Error).message ?? 'Sign in failed.';
    }
  }, [check]);

  const logout = useCallback(async () => {
    if (isMockMode()) {
      localStorage.removeItem(MOCK_SESSION_KEY);
      setIsAdmin(false);
      setUsername(null);
      return;
    }
    try {
      const { signOut } = await import('aws-amplify/auth');
      await signOut();
    } catch { /* ignore */ }
    setIsAdmin(false);
    setUsername(null);
  }, []);

  return { isAdmin, loading, username, login, logout };
}
