import { ArrowRight, CalendarDays, Clock, Plus, ShoppingBag, TrendingUp } from 'lucide-react';
import { formatRelativeTime, useDashboardData, useOrderStats } from '../hooks/useAdminData';

const STATUS_CONFIG: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
};

export default function AdminDashboard() {
  const { data, loading, error } = useDashboardData();
  const stats = useOrderStats(data.orders);

  const cards = [
    {
      label: "Today's Orders",
      display: String(data.summary?.totalOrdersToday ?? stats.totalOrders),
      sub: `${stats.activeOrders} active right now`,
      icon: <ShoppingBag size={20} />,
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
    },
    {
      label: "Today's Revenue",
      display: `€${(data.summary?.totalRevenueToday ?? stats.revenue).toFixed(2)}`,
      sub: `€${(data.summary?.averageOrderValue ?? 0).toFixed(2)} avg order value`,
      icon: <TrendingUp size={20} />,
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
    },
    {
      label: 'Pending Orders',
      display: String(stats.activeOrders),
      sub: 'Needs staff attention',
      icon: <Clock size={20} />,
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200',
    },
    {
      label: 'Popular Items',
      display: String(data.summary?.popularItems?.length ?? 0),
      sub: 'Tracked from recent orders',
      icon: <CalendarDays size={20} />,
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Temple Street, Dublin 2</p>
        </div>
        <button className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors">
          <Plus size={16} /> Quick Add
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              <div className={`p-2 rounded-lg border ${card.bg} ${card.text} ${card.border}`}>{card.icon}</div>
            </div>
            <p className="text-3xl font-bold text-gray-800">{loading ? '…' : card.display}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Recent Orders</h2>
          <button className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium">
            View all <ArrowRight size={14} />
          </button>
        </div>
        {loading ? (
          <div className="px-6 py-10 text-sm text-gray-400">Loading dashboard data…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                  {['Order #', 'Customer', 'Items', 'Total', 'Status', 'Time'].map((heading) => (
                    <th key={heading} className="px-6 py-3 font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">{order.orderNumber}</td>
                    <td className="px-6 py-3 font-medium text-gray-800">{order.customerName}</td>
                    <td className="px-6 py-3 text-gray-500">{order.items.length}</td>
                    <td className="px-6 py-3 font-semibold text-gray-800">€{order.total.toFixed(2)}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-xs">{formatRelativeTime(order.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Best Sellers</h2>
        {loading ? (
          <p className="text-sm text-gray-400">Loading item performance…</p>
        ) : data.summary?.popularItems?.length ? (
          <div className="space-y-3">
            {data.summary.popularItems.map((item) => (
              <div key={item.itemId} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{item.name}</span>
                <span className="font-semibold text-gray-800">{item.count} sold</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No order activity yet.</p>
        )}
      </div>
    </div>
  );
}
