import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, Edit2, Leaf, Loader2, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import type { MenuCategory, MenuItem } from '../../types';
import { uploadsApi } from '../../lib/api';
import { useMenuAdminData } from '../hooks/useAdminData';

// Friendly names for the fixed menu category ids. Used as a fallback so the
// admin always sees readable names (e.g. "Main Course") instead of raw ids ("2").
const CATEGORY_NAMES: Record<string, string> = {
  '1': 'Starters',
  '2': 'Main Course',
  '3': 'Breads & Rice',
  '4': 'Beverages & Desserts',
};

const categoryLabel = (id: string, apiName?: string) =>
  apiName && apiName !== id ? apiName : CATEGORY_NAMES[id] ?? `Category ${id}`;

type ItemForm = Pick<MenuItem, 'categoryId' | 'name' | 'description' | 'price' | 'imageUrl' | 'isVegetarian' | 'isVegan' | 'isGlutenFree' | 'isAvailable'>;

const BLANK: ItemForm = {
  categoryId: '1',
  name: '',
  description: '',
  price: 0,
  imageUrl: '',
  isVegetarian: false,
  isVegan: false,
  isGlutenFree: false,
  isAvailable: true,
};

function ItemModal({ item, categories, onSave, onClose }: { item: MenuItem | null; categories: MenuCategory[]; onSave: (d: ItemForm) => void; onClose: () => void }) {
  const init: ItemForm = item ? { categoryId: item.categoryId, name: item.name, description: item.description, price: item.price, imageUrl: item.imageUrl ?? '', isVegetarian: item.isVegetarian, isVegan: item.isVegan, isGlutenFree: item.isGlutenFree, isAvailable: item.isAvailable } : BLANK;
  const [form, setForm] = useState<ItemForm>(init);
  const [priceStr, setPriceStr] = useState(item ? item.price.toFixed(2) : '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof ItemForm, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image must be under 10 MB'); return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const presignRes = await uploadsApi.presign(file.name, file.type);
      if (presignRes.error || !presignRes.data?.uploadUrl) {
        throw new Error(presignRes.error ?? 'Could not get upload URL');
      }
      await uploadsApi.uploadFile(presignRes.data.uploadUrl, file);
      set('imageUrl', presignRes.data.publicUrl);
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">{item ? 'Edit Item' : 'Add New Item'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave({ ...form, price: parseFloat(priceStr) || 0 }); }} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">Which section of the menu this dish appears in.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
            <input type="text" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. MALABAR CHICKEN BIRIYANI" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea required rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the dish..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (€) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
              <input type="number" step="0.01" min="0" required value={priceStr} onChange={e => setPriceStr(e.target.value)} placeholder="0.00" className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex items-center gap-3">
              {/* Upload button */}
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-amber-400 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploading ? 'Uploading…' : 'Upload from device'}
              </button>
              {/* Current image preview */}
              {form.imageUrl?.trim() && (
                <div className="relative group">
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }}
                  />
                  <button
                    type="button"
                    onClick={() => set('imageUrl', '')}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
            </div>
            {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
            <p className="text-xs text-gray-400 mt-1">JPEG · PNG · WebP · GIF — max 10 MB. Stored in your AWS S3 bucket.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Flags</label>
            <div className="flex flex-wrap gap-4">
              {(['isVegetarian', 'isVegan', 'isGlutenFree'] as const).map(key => (
                <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} className="w-4 h-4 text-amber-600 rounded" />
                  <span className="text-sm text-gray-600">{{ isVegetarian: 'Vegetarian', isVegan: 'Vegan', isGlutenFree: 'Gluten-Free' }[key]}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Available on Menu</span>
            <button type="button" onClick={() => set('isAvailable', !form.isAvailable)} className={`relative w-11 h-6 rounded-full transition-colors ${form.isAvailable ? 'bg-amber-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 bg-amber-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors">{item ? 'Save Changes' : 'Add Item'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminMenu() {
  const { data, loading, error, createItem, updateItem, deleteItem } = useMenuAdminData();
  const [catFilter, setCatFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const filtered = useMemo(() => data.items.filter(i => (catFilter === 'all' || i.categoryId === catFilter) && (!query || i.name.toLowerCase().includes(query.toLowerCase()))), [data.items, catFilter, query]);
  const displayCategories = useMemo(() => data.categories.map(c => ({ ...c, name: categoryLabel(c.id, c.name) })), [data.categories]);

  const openAdd  = () => { setEditItem(null);  setShowModal(true); };
  const openEdit = (item: MenuItem) => { setEditItem(item); setShowModal(true); };

  const handleSave = async (form: ItemForm) => {
    const payload = {
      categoryId: form.categoryId,
      name: form.name,
      slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: form.description,
      longDescription: form.description,
      price: form.price,
      imageUrl: form.imageUrl ?? '',
      isVegetarian: form.isVegetarian,
      isVegan: form.isVegan,
      isGlutenFree: form.isGlutenFree,
      isAvailable: form.isAvailable,
      isFeatured: false,
      displayOrder: editItem?.displayOrder ?? data.items.length + 1,
    };
    const ok = editItem ? await updateItem(editItem.id, payload) : await createItem(payload);
    if (!ok) return;
    setShowModal(false);
    setEditItem(null);
    setFlash(true);
    setTimeout(() => setFlash(false), 2000);
  };

  const toggleAvail = async (item: MenuItem) => {
    await updateItem(item.id, { isAvailable: !item.isAvailable });
  };
  const doDelete = async () => {
    if (!deleteId) return;
    const ok = await deleteItem(deleteId);
    if (ok) setDeleteId(null);
  };
  const catName = (id: string) => categoryLabel(id, data.categories.find(c => c.id === id)?.name);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Menu Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data.items.length} items · {data.categories.length} categories</p>
        </div>
        <div className="flex items-center gap-3">
          {flash && <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium"><Check size={15} /> Saved</span>}
          <button onClick={openAdd} className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors"><Plus size={16} /> Add Item</button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search items..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[{ id: 'all', name: `All (${data.items.length})` }, ...displayCategories.map(c => ({ id: c.id, name: `${c.name} (${data.items.filter(i => i.categoryId === c.id).length})` }))].map(c => (
            <button key={c.id} onClick={() => setCatFilter(c.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${catFilter === c.id ? 'bg-amber-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{c.name}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400"><p className="text-sm">Loading menu items…</p></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><Search size={36} className="mx-auto mb-3 opacity-30" /><p className="text-sm">No items found.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.id} className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all ${item.isAvailable ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              {item.imageUrl?.trim() && (
                <img src={item.imageUrl} alt={item.name} className="w-full h-32 object-cover rounded-t-xl" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 mr-3">
                    <h3 className="font-semibold text-gray-800 text-sm leading-snug">{item.name}</h3>
                    <p className="text-xs text-amber-600 font-medium mt-0.5">{catName(item.categoryId)}</p>
                  </div>
                  <span className="text-base font-bold text-gray-800 shrink-0">€{item.price.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{item.description}</p>
                <div className="flex items-center gap-1 mb-3">
                  {item.isVegetarian && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><Leaf size={9} />Veg</span>}
                  {item.isVegan     && <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">Vegan</span>}
                  {item.isGlutenFree && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">GF</span>}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <button onClick={() => void toggleAvail(item)} className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${item.isAvailable ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`relative w-8 h-4 rounded-full transition-colors ${item.isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${item.isAvailable ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    {item.isAvailable ? 'Available' : 'Hidden'}
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => setDeleteId(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-8">Admin data persists locally in mock mode and switches to AWS APIs automatically once `VITE_API_BASE_URL` is configured.</p>

      {showModal && <ItemModal item={editItem} categories={displayCategories} onSave={(form) => void handleSave(form)} onClose={() => setShowModal(false)} />}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle size={20} className="text-red-600" /></div>
              <div><h3 className="font-bold text-gray-800">Delete Item?</h3><p className="text-xs text-gray-500">This cannot be undone.</p></div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={doDelete} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
