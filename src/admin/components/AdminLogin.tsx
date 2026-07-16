// ─────────────────────────────────────────────────────────────────────────────
// ADMIN LOGIN SCREEN
// Shown when the user is not authenticated as an admin.
// Mock mode: PIN-based entry. Production: Cognito email + password.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type FormEvent } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import type { AdminGuardState } from '../hooks/useAdminGuard';

const IS_MOCK = !import.meta.env.VITE_API_BASE_URL;

interface Props {
  onLogin: AdminGuardState['login'];
}

export default function AdminLogin({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await onLogin(IS_MOCK ? password : email, IS_MOCK ? undefined : password);
    if (err) setError(err);
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-600/10 mb-4">
            <ShieldCheck className="text-amber-400" size={28} />
          </div>
          <p className="text-amber-400 text-2xl font-bold tracking-tight">Pulari Admin</p>
          <p className="text-gray-400 text-sm mt-1">Restaurant management panel</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-8 border border-gray-800 space-y-5">
          {/* Dev mode banner */}
          {IS_MOCK && (
            <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl px-4 py-3">
              <p className="text-amber-300 text-xs font-semibold">🔧 Dev / mock mode</p>
              <p className="text-gray-400 text-xs mt-0.5">
                Enter admin PIN to continue.{' '}
                <span className="text-amber-400 font-mono">Default: admin1234</span>
              </p>
            </div>
          )}

          {/* Email field — production only */}
          {!IS_MOCK && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                placeholder="admin@pulari.ie"
              />
            </div>
          )}

          {/* Password / PIN field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              {IS_MOCK ? 'Admin PIN' : 'Password'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              placeholder={IS_MOCK ? 'Enter PIN…' : '••••••••'}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-amber-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-700 text-xs mt-6">
          Pulari Restaurant · Management System
        </p>
      </div>
    </div>
  );
}
