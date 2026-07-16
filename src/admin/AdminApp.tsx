// ─────────────────────────────────────────────────────────────────────────────
// ADMIN PANEL — Root Layout
// Protected by useAdminGuard: mock PIN in dev, Cognito "admins" group in prod.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import AdminSidebar from './components/AdminSidebar';
import AdminLogin from './components/AdminLogin';
import { useAdminGuard } from './hooks/useAdminGuard';
import AdminDashboard from './pages/AdminDashboard';
import AdminMenu from './pages/AdminMenu';
import AdminOrders from './pages/AdminOrders';
import AdminReservations from './pages/AdminReservations';
import AdminBlog from './pages/AdminBlog';
import AdminOffers from './pages/AdminOffers';
import AdminCoupons from './pages/AdminCoupons';
import AdminReviews from './pages/AdminReviews';
import AdminSettings from './pages/AdminSettings';
import AdminUsers from './pages/AdminUsers';

export type AdminPage =
  | 'dashboard'
  | 'menu'
  | 'orders'
  | 'reservations'
  | 'blog'
  | 'offers'
  | 'coupons'
  | 'reviews'
  | 'users'
  | 'settings';

interface AdminAppProps {
  onExitAdmin: () => void;
}

export default function AdminApp({ onExitAdmin }: AdminAppProps) {
  const [activePage, setActivePage] = useState<AdminPage>('dashboard');
  const { isAdmin, loading, username, login, logout } = useAdminGuard();

  // ── Loading: checking auth ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-400" size={32} />
      </div>
    );
  }

  // ── Not authenticated: show login ───────────────────────────────────────────
  if (!isAdmin) {
    return <AdminLogin onLogin={login} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':     return <AdminDashboard />;
      case 'menu':          return <AdminMenu />;
      case 'orders':        return <AdminOrders />;
      case 'reservations':  return <AdminReservations />;
      case 'blog':          return <AdminBlog />;
      case 'offers':        return <AdminOffers />;
      case 'coupons':       return <AdminCoupons />;
      case 'reviews':       return <AdminReviews />;
      case 'users':         return <AdminUsers />;
      case 'settings':      return <AdminSettings />;
      default:              return <AdminDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <AdminSidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onExitAdmin={onExitAdmin}
        onSignOut={logout}
        username={username}
      />
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
}
