// ADMIN USERS — View registered customers

import { useMemo, useState } from 'react';
import { Users, Search } from 'lucide-react';
import { formatRelativeTime, useUsersAdminData } from '../hooks/useAdminData';

const ROLE_CLS: Record<string, string> = {
  admin:    'bg-red-100 text-red-700',
  manager:  'bg-purple-100 text-purple-700',
  editor:   'bg-blue-100 text-blue-700',
  customer: 'bg-gray-100 text-gray-600',
};

export default function AdminUsers() {
  const { data: users, loading, error } = useUsersAdminData();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) =>
      u.email.toLowerCase().includes(q) ||
      (u.fullName?.toLowerCase().includes(q)) ||
      (u.phone?.includes(q)),
    );
  }, [users, query]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} registered accounts</p>
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone…"
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading customers…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{query ? 'No customers match your search.' : 'No customers yet.'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                {['Name', 'Email', 'Phone', 'Role', 'Verified', 'Last Seen', 'Joined'].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800">{user.fullName || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{user.email}</td>
                  <td className="px-5 py-3 text-gray-500">{user.phone ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${ROLE_CLS[user.role] ?? ROLE_CLS.customer}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {user.isEmailVerified
                      ? <span className="text-xs text-green-600 font-medium">✓ Verified</span>
                      : <span className="text-xs text-yellow-600 font-medium">Unverified</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : '—'}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{formatRelativeTime(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-center text-xs text-gray-400 mt-4">User data is read from the local mock store. Switch to AWS Cognito API for live data.</p>
    </div>
  );
}
