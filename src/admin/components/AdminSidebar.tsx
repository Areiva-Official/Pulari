import type { AdminPage } from '../AdminApp';
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag, CalendarDays,
  BookOpen, Tag, Ticket, Star, Users, Settings, LogOut, ExternalLink
} from 'lucide-react';

const navItems: { id: AdminPage; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',    label: 'Dashboard',    icon: <LayoutDashboard size={18} /> },
  { id: 'orders',       label: 'Orders',       icon: <ShoppingBag size={18} /> },
  { id: 'menu',         label: 'Menu',         icon: <UtensilsCrossed size={18} /> },
  { id: 'reservations', label: 'Reservations', icon: <CalendarDays size={18} /> },
  { id: 'offers',       label: 'Offers',       icon: <Tag size={18} /> },
  { id: 'coupons',      label: 'Coupons',      icon: <Ticket size={18} /> },
  { id: 'blog',         label: 'Blog',         icon: <BookOpen size={18} /> },
  { id: 'reviews',      label: 'Reviews',      icon: <Star size={18} /> },
  { id: 'users',        label: 'Customers',    icon: <Users size={18} /> },
  { id: 'settings',     label: 'Settings',     icon: <Settings size={18} /> },
];

interface Props {
  activePage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  onExitAdmin: () => void;
  onSignOut: () => Promise<void>;
  username: string | null;
}

export default function AdminSidebar({ activePage, onNavigate, onExitAdmin, onSignOut, username }: Props) {
  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-gray-700">
        <p className="text-amber-400 font-bold text-base">Pulari Admin</p>
        <p className="text-gray-400 text-xs mt-0.5 truncate">{username ?? 'Restaurant Panel'}</p>
      </div>

      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activePage === item.id
                ? 'bg-amber-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-2 pb-4 space-y-1 border-t border-gray-700 pt-4">
        <button
          onClick={onExitAdmin}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <ExternalLink size={18} />
          View Site
        </button>
        <button
          onClick={() => void onSignOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
