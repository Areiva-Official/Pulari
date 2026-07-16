// ADMIN OFFERS — Manage special offers shown on the public site

import { useMemo, useState } from 'react';
import { Calendar, GripVertical, Image as ImageIcon, Plus, Tag, Trash2, X } from 'lucide-react';
import type { SpecialOffer } from '../../types';
import { useOffersAdminData } from '../hooks/useAdminData';

const BLANK: Omit<SpecialOffer, 'id' | 'createdAt' | 'updatedAt'> = {
  slug: '', title: '', subtitle: '', description: '', price: '', badge: '',
  color: 'from-amber-500 to-orange-500', imageUrl: '', validFrom: '', validUntil: '',
  isActive: true, displayOrder: 99,
};

const COLOR_OPTIONS = [
  'from-amber-500 to-orange-500',
  'from-orange-500 to-red-500',
  'from-yellow-500 to-amber-600',
  'from-green-500 to-emerald-500',
  'from-purple-500 to-fuchsia-500',
  'from-sky-500 to-cyan-500',
];

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function OfferModal({ offer, onSave, onClose }: {
  offer: Partial<SpecialOffer>;
  onSave: (data: Omit<SpecialOffer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...BLANK, ...offer });
  const [error, setError] = useState<string | null>(null);

  const field = (k: keyof typeof form) => ({
    value: String(form[k] ?? ''),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => {
        const nextValue = e.target.value;
        if (k === 'title') {
          return {
            ...prev,
            title: nextValue,
            slug: prev.slug === toSlug(prev.title || '') || !prev.slug ? toSlug(nextValue) : prev.slug,
          };
        }
        return { ...prev, [k]: nextValue };
      }),
  });

  const handleSave = () => {
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!form.slug.trim()) {
      setError('Slug is required.');
      return;
    }
    if (!form.description.trim()) {
      setError('Description is required.');
      return;
    }
    setError(null);
    onSave({
      ...form,
      slug: toSlug(form.slug),
      title: form.title.trim(),
      subtitle: form.subtitle?.trim() || undefined,
      description: form.description.trim(),
      price: form.price?.trim() || undefined,
      badge: form.badge?.trim() || undefined,
      imageUrl: form.imageUrl?.trim() || undefined,
      validFrom: form.validFrom || undefined,
      validUntil: form.validUntil || undefined,
      displayOrder: Number(form.displayOrder) || 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <p className="font-semibold text-gray-800">{offer.id ? 'Edit Offer' : 'New Offer'}</p>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['title', 'slug', 'price', 'badge'] as const).map((k) => (
              <div key={k}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 capitalize">{k}</label>
                <input {...field(k)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Subtitle</label>
            <input {...field('subtitle')} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Image URL</label>
            <div className="relative">
              <ImageIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                {...field('imageUrl')}
                placeholder="https://..."
                className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</label>
            <textarea {...field('description')} rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Display Order</label>
              <div className="relative">
                <GripVertical size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  min={0}
                  value={Number(form.displayOrder) || 0}
                  onChange={(e) => setForm((prev) => ({ ...prev, displayOrder: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Valid From</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={form.validFrom ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, validFrom: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Valid Until</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={form.validUntil ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, validUntil: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Gradient</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {COLOR_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, color: option }))}
                  className={`h-12 rounded-xl bg-gradient-to-r ${option} ${form.color === option ? 'ring-2 ring-offset-2 ring-amber-500' : ''}`}
                  aria-label={option}
                />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-amber-600" />
            <span className="text-sm font-medium text-gray-700">Active (visible on public site)</span>
          </label>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        </div>
        <div className="p-5 pt-0 flex gap-3">
          <button onClick={handleSave} className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-700 transition-colors">Save</button>
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOffers() {
  const { data: offers, loading, error, create, update, remove } = useOffersAdminData();
  const [editing, setEditing] = useState<Partial<SpecialOffer> | null>(null);
  const activeCount = useMemo(() => offers.filter((o) => o.isActive).length, [offers]);

  const handleSave = async (data: Omit<SpecialOffer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const ok = editing?.id ? await update(editing.id, data) : await create(data);
    if (!ok) return;
    setEditing(null);
  };

  const handleDelete = async (offer: SpecialOffer) => {
    const confirmed = window.confirm(`Delete offer “${offer.title}”?`);
    if (!confirmed) return;
    await remove(offer.id);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Special Offers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{activeCount} active · {offers.length} total</p>
        </div>
        <button onClick={() => setEditing(BLANK)} className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors inline-flex items-center gap-2">
          <Plus size={16} /> New Offer
        </button>
      </div>
      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {offers.map((offer) => (
            <div key={offer.id} className={`rounded-2xl border-2 overflow-hidden shadow-sm transition-all ${offer.isActive ? 'border-transparent' : 'border-gray-200 opacity-60'}`}>
              <div className={`bg-gradient-to-br ${offer.color ?? 'from-gray-400 to-gray-500'} p-5 text-white`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {offer.badge && <span className="inline-block bg-white/20 text-xs font-semibold px-2 py-0.5 rounded-full mb-2">{offer.badge}</span>}
                    <p className="font-bold text-lg leading-tight">{offer.title}</p>
                    {offer.subtitle && <p className="text-white/80 text-sm mt-0.5">{offer.subtitle}</p>}
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wide bg-black/15 px-2 py-1 rounded-full">
                    #{offer.displayOrder}
                  </span>
                </div>
                {offer.price && <p className="text-2xl font-black mt-2">{offer.price}</p>}
              </div>
              <div className="bg-white p-4">
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">{offer.description}</p>
                <div className="text-xs text-gray-400 space-y-1 mb-3">
                  <p>Slug: <span className="font-mono">{offer.slug}</span></p>
                  {(offer.validFrom || offer.validUntil) && (
                    <p>
                      Window: {offer.validFrom || 'now'} → {offer.validUntil || 'open-ended'}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={offer.isActive} onChange={(e) => void update(offer.id, { isActive: e.target.checked })} className="w-4 h-4 accent-amber-600" />
                    <span className="text-xs font-medium text-gray-600">{offer.isActive ? 'Active' : 'Inactive'}</span>
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(offer)} className="text-xs text-amber-600 hover:text-amber-700 font-medium">Edit</button>
                    <button onClick={() => void handleDelete(offer)} className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium"><Trash2 size={14} />Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {offers.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <Tag size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No offers yet. Create one above.</p>
            </div>
          )}
        </div>
      )}
      {editing && <OfferModal offer={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
    </div>
  );
}
