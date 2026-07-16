// ADMIN COUPONS — Create and manage discount/promo codes

import { useState } from 'react';
import { Ticket, Copy, Check, X } from 'lucide-react';
import type { Coupon } from '../../types';
import { useCouponsAdminData } from '../hooks/useAdminData';

const BLANK: Omit<Coupon, 'id' | 'createdAt' | 'currentUses'> = {
  code: '', type: 'percentage', value: 10, minOrderAmount: 20,
  maxUsesTotal: 100, isActive: true, validFrom: new Date().toISOString().slice(0, 10), createdBy: 'admin',
};

function CouponModal({ coupon, onSave, onClose }: {
  coupon: Partial<Coupon>;
  onSave: (data: Omit<Coupon, 'id' | 'createdAt' | 'currentUses'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...BLANK, ...coupon });
  const inp = (k: keyof typeof form, type = 'text') => ({
    type,
    value: String(form[k] ?? ''),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [k]: type === 'number' ? Number(e.target.value) : e.target.value })),
  });
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <p className="font-semibold text-gray-800">{coupon.id ? 'Edit Coupon' : 'New Coupon'}</p>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Code (uppercase)</label>
            <input {...inp('code')} placeholder="e.g. WELCOME10"
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as Coupon['type'] }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (€)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Value</label>
              <input {...inp('value', 'number')} min={0} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Min Order (€)</label>
              <input {...inp('minOrderAmount', 'number')} min={0} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Max Uses</label>
              <input {...inp('maxUsesTotal', 'number')} min={0} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-amber-600" />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
        </div>
        <div className="p-5 pt-0 flex gap-3">
          <button onClick={() => onSave(form)} className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-700 transition-colors">Save Coupon</button>
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCoupons() {
  const { data: coupons, loading, error, create, update, remove } = useCouponsAdminData();
  const [editing, setEditing] = useState<Partial<Coupon> | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleSave = async (data: Omit<Coupon, 'id' | 'createdAt' | 'currentUses'>) => {
    if (editing?.id) await update(editing.id, data);
    else await create(data);
    setEditing(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Coupons</h1>
          <p className="text-sm text-gray-500 mt-0.5">{coupons.filter((c) => c.isActive).length} active codes</p>
        </div>
        <button onClick={() => setEditing(BLANK)} className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors">
          + Create Coupon
        </button>
      </div>
      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Ticket size={36} className="mx-auto mb-3 opacity-30" /><p className="text-sm">No coupons yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                {['Code', 'Discount', 'Min Order', 'Uses', 'Expires', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-lg text-xs">{coupon.code}</span>
                      <button onClick={() => copyCode(coupon.code)} className="text-gray-400 hover:text-amber-600 transition-colors">
                        {copied === coupon.code ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-700">
                    {coupon.type === 'percentage' ? `${coupon.value}%` : `€${coupon.value}`}
                  </td>
                  <td className="px-5 py-3 text-gray-500">€{coupon.minOrderAmount ?? 0}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {coupon.currentUses}
                    {coupon.maxUsesTotal ? <span className="text-gray-400"> / {coupon.maxUsesTotal}</span> : null}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{coupon.validUntil ?? '—'}</td>
                  <td className="px-5 py-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={coupon.isActive} onChange={(e) => void update(coupon.id, { isActive: e.target.checked })} className="w-3.5 h-3.5 accent-amber-600" />
                      <span className={`text-xs font-semibold ${coupon.isActive ? 'text-green-600' : 'text-gray-400'}`}>{coupon.isActive ? 'Active' : 'Off'}</span>
                    </label>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => setEditing(coupon)} className="text-xs text-amber-600 hover:text-amber-700 font-medium">Edit</button>
                      <button onClick={() => void remove(coupon.id)} className="text-xs text-red-400 hover:text-red-600 font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {editing && <CouponModal coupon={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
    </div>
  );
}
