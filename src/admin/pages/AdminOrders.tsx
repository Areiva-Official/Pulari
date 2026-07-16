import { useMemo, useState } from 'react';
import { X, Package } from 'lucide-react';
import type { Order } from '../../types';
import { formatRelativeTime, useOrdersAdminData } from '../hooks/useAdminData';

type OrderStatus = Order['status'];

const STATUS_CONFIG: Record<OrderStatus, { label: string; cls: string }> = {
  pending:   { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-700' },
  paid:      { label: 'Paid',      cls: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Confirmed', cls: 'bg-indigo-100 text-indigo-700' },
  preparing: { label: 'Preparing', cls: 'bg-orange-100 text-orange-700' },
  ready:     { label: 'Ready',     cls: 'bg-green-100 text-green-700' },
  completed: { label: 'Completed', cls: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-600' },
  refunded:  { label: 'Refunded',  cls: 'bg-rose-100 text-rose-700' },
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: 'confirmed', confirmed: 'preparing', preparing: 'ready', ready: 'completed',
};

const STATUS_TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function DetailsModal({ order, onClose, onUpdate }: { order: Order; onClose: () => void; onUpdate: (id: string, s: OrderStatus) => void }) {
  const s = STATUS_CONFIG[order.status];
  const next = NEXT_STATUS[order.status];
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <p className="font-mono text-sm text-gray-500">{order.id}</p>
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${s.cls}`}>{s.label}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Customer</p>
            <p className="font-semibold text-gray-800">{order.customerName}</p>
            <p className="text-sm text-gray-500">{order.customerEmail} · {order.customerPhone}</p>
            <p className="text-sm text-gray-500 capitalize mt-0.5">Type: {order.type.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Items</p>
            <div className="space-y-1.5">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.quantity}× {item.name}</span>
                  <span className="font-medium text-gray-800">€{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-100">
              <span className="font-semibold text-gray-800">Total</span>
              <span className="font-bold text-lg text-gray-800">€{order.total.toFixed(2)}</span>
            </div>
          </div>
          {next && (
            <button onClick={() => { onUpdate(order.id, next); onClose(); }}
              className="w-full bg-amber-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-700 transition-colors">
              Mark as {STATUS_CONFIG[next].label} →
            </button>
          )}
          {order.status !== 'cancelled' && order.status !== 'completed' && (
            <button onClick={() => { onUpdate(order.id, 'cancelled'); onClose(); }}
              className="w-full border border-red-300 text-red-600 py-2 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">
              Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const { data: orders, loading, error, updateStatus } = useOrdersAdminData();
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  const filtered = useMemo(() => activeTab === 'all' ? orders : orders.filter((order) => order.status === activeTab), [activeTab, orders]);
  const activeOrders = orders.filter((order) => ['preparing', 'confirmed', 'ready', 'paid', 'pending'].includes(order.status)).length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{activeOrders} active orders</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
        {STATUS_TABS.map(tab => {
          const count = tab.key === 'all' ? orders.length : orders.filter((order) => order.status === tab.key).length;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.key ? 'bg-amber-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400"><p className="text-sm">Loading orders…</p></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No orders in this category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                  {['Order #', 'Customer', 'Type', 'Items', 'Total', 'Status', 'Time', 'Action'].map(h => (
                    <th key={h} className="px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(order => {
                  const s = STATUS_CONFIG[order.status];
                  const next = NEXT_STATUS[order.status];
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">{order.orderNumber}</td>
                      <td className="px-5 py-3 font-medium text-gray-800">{order.customerName}</td>
                      <td className="px-5 py-3 text-gray-500 capitalize text-xs">{order.type.replace('_',' ')}</td>
                      <td className="px-5 py-3 text-gray-500">{order.items.length}</td>
                      <td className="px-5 py-3 font-semibold text-gray-800">€{order.total.toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{formatRelativeTime(order.updatedAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {next && (
                            <button onClick={() => void updateStatus(order.id, next)}
                              className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-medium hover:bg-amber-200 transition-colors whitespace-nowrap">
                              → {STATUS_CONFIG[next].label}
                            </button>
                          )}
                          {!['completed', 'cancelled', 'refunded'].includes(order.status) && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Cancel order ${order.orderNumber}?`)) void updateStatus(order.id, 'cancelled');
                              }}
                              className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap">
                              ✕ Cancel
                            </button>
                          )}
                          <button onClick={() => setViewOrder(order)} className="text-xs text-gray-400 hover:text-amber-600 font-medium">View</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-center text-xs text-gray-400 mt-6">Admin data persists locally in mock mode and switches to AWS APIs automatically once `VITE_API_BASE_URL` is configured.</p>

      {viewOrder && <DetailsModal order={viewOrder} onClose={() => setViewOrder(null)} onUpdate={(id, status) => void updateStatus(id, status)} />}
    </div>
  );
}
