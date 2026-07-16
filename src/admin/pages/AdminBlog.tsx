// ADMIN BLOG — Full CRUD: create, edit, publish/unpublish, delete blog posts

import { useMemo, useState } from 'react';
import {
  AlertCircle, BookOpen, Calendar, Edit2,
  Globe, Loader2, Plus, Trash2, X,
} from 'lucide-react';
import type { BlogPost } from '../../types';
import { formatRelativeTime, useBlogAdminData } from '../hooks/useAdminData';

type PostStatus = BlogPost['status'];

const STATUS_CONFIG: Record<PostStatus, { label: string; cls: string }> = {
  draft:     { label: 'Draft',     cls: 'bg-yellow-100 text-yellow-700' },
  published: { label: 'Published', cls: 'bg-green-100 text-green-700' },
  archived:  { label: 'Archived',  cls: 'bg-gray-100 text-gray-500' },
};

const CATEGORIES = [
  { id: 'bc1', name: 'Food & Culture' },
  { id: 'bc2', name: 'Recipes & Tips' },
  { id: 'bc3', name: 'Restaurant News' },
];
const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name]));

const STATUS_TABS: { key: PostStatus | 'all'; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'published', label: 'Published' },
  { key: 'draft',     label: 'Drafts'    },
  { key: 'archived',  label: 'Archived'  },
];

const BLANK: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'> = {
  slug: '', title: '', excerpt: '', content: '',
  featuredImageUrl: '', featuredImageAlt: '',
  categoryId: 'bc1', authorName: 'Pulari Team',
  status: 'draft', tags: [], readingTimeMinutes: 3,
  metaTitle: '', metaDescription: '',
};

function toSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// ─── EDITOR MODAL ─────────────────────────────────────────────────────────────

function PostEditor({
  post, saving, onSave, onClose,
}: {
  post: Partial<BlogPost>;
  saving: boolean;
  onSave: (data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>, publish: boolean) => void;
  onClose: () => void;
}) {
  const isEdit = !!post.id;
  const [form, setFormState] = useState<Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>>({
    ...BLANK, ...post, tags: post.tags ?? [],
  });
  const [tagsInput, setTagsInput] = useState((post.tags ?? []).join(', '));
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setFormState((prev) => {
      const next = { ...prev, [k]: v };
      if (k === 'title') {
        const t = String(v);
        if (!prev.slug || prev.slug === toSlug(prev.title ?? '')) next.slug = toSlug(t);
      }
      if (k === 'content') next.readingTimeMinutes = estimateReadingTime(String(v));
      return next;
    });
  }

  const handleSubmit = (publish: boolean) => {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!form.excerpt.trim()) { setError('Excerpt is required.'); return; }
    if (!form.content.trim()) { setError('Content is required.'); return; }
    setError(null);
    const parsedTags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    onSave({ ...form, slug: toSlug(form.slug || form.title), tags: parsedTags }, publish);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="font-bold text-gray-800 text-lg">{isEdit ? 'Edit Post' : 'New Post'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main — 2/3 */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Title *</label>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Post title"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Slug</label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-amber-500">
                <span className="pl-3 text-gray-400 text-sm whitespace-nowrap">pulari.ie/blog/</span>
                <input
                  value={form.slug}
                  onChange={(e) => set('slug', e.target.value)}
                  className="flex-1 px-2 py-2.5 text-sm font-mono focus:outline-none"
                  placeholder="post-url-slug"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Excerpt *</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => set('excerpt', e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                placeholder="Short description shown in post listings and search results…"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Content * <span className="font-normal text-gray-400">(Markdown supported)</span>
              </label>
              <textarea
                value={form.content}
                onChange={(e) => set('content', e.target.value)}
                rows={18}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
                placeholder={'## Heading\n\nParagraph text here.\n\n### Sub-heading\n\n- List item 1\n- List item 2'}
              />
              <p className="text-xs text-gray-400 mt-1">~{form.readingTimeMinutes} min read</p>
            </div>
          </div>

          {/* Sidebar — 1/3 */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => set('categoryId', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Author</label>
              <input
                value={form.authorName}
                onChange={(e) => set('authorName', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Tags <span className="font-normal text-gray-400">comma-separated</span>
              </label>
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="kerala, food, dublin"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Featured Image URL</label>
              <input
                value={form.featuredImageUrl ?? ''}
                onChange={(e) => set('featuredImageUrl', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="https://…"
              />
            </div>
            {form.featuredImageUrl && (
              <img
                src={form.featuredImageUrl}
                alt="preview"
                className="w-full h-32 object-cover rounded-xl border border-gray-100"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SEO Overrides</p>
              <input
                value={form.metaTitle ?? ''}
                onChange={(e) => set('metaTitle', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Meta title (defaults to post title)"
              />
              <textarea
                value={form.metaDescription ?? ''}
                onChange={(e) => set('metaDescription', e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Meta description (defaults to excerpt)"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-2 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={16} className="flex-shrink-0" /> {error}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
          <div className="flex gap-3">
            <button
              onClick={() => handleSubmit(false)}
              disabled={saving}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={saving}
              className="px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
              {form.status === 'published' ? 'Update' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN LIST PAGE ───────────────────────────────────────────────────────────

export default function AdminBlog() {
  const { data: posts, loading, error, create, update, remove } = useBlogAdminData();
  const [activeTab, setActiveTab] = useState<PostStatus | 'all'>('all');
  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () => (activeTab === 'all' ? posts : posts.filter((p) => p.status === activeTab)),
    [activeTab, posts],
  );
  const publishedCount = useMemo(() => posts.filter((p) => p.status === 'published').length, [posts]);
  const draftCount = useMemo(() => posts.filter((p) => p.status === 'draft').length, [posts]);

  const handleSave = async (data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>, publish: boolean) => {
    setSaving(true);
    const finalData = {
      ...data,
      status: (publish ? 'published' : 'draft') as BlogPost['status'],
      publishedAt: publish
        ? (editing?.publishedAt ?? new Date().toISOString())
        : data.publishedAt,
    };
    const ok = editing?.id ? await update(editing.id, finalData) : await create(finalData);
    setSaving(false);
    if (ok) setEditing(null);
  };

  const handleDelete = async (post: BlogPost) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    await remove(post.id);
  };

  const togglePublish = async (post: BlogPost) => {
    const newStatus: BlogPost['status'] = post.status === 'published' ? 'draft' : 'published';
    await update(post.id, {
      status: newStatus,
      publishedAt: newStatus === 'published' ? new Date().toISOString() : post.publishedAt,
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Blog Posts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {posts.length} total · {publishedCount} published · {draftCount} draft{draftCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setEditing(BLANK)}
          className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
        >
          <Plus size={16} /> New Post
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
        {STATUS_TABS.map((tab) => {
          const count = tab.key === 'all' ? posts.length : posts.filter((p) => p.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key ? 'bg-amber-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Post list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2 text-sm">
            <Loader2 size={20} className="animate-spin" /> Loading posts…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{activeTab === 'all' ? 'No posts yet. Create one above.' : 'No posts in this category.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                  {['Title', 'Category', 'Status', 'Tags', 'Author', 'Updated', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((post) => {
                  const sc = STATUS_CONFIG[post.status];
                  return (
                    <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 max-w-xs">
                        <p className="font-semibold text-gray-800 truncate">{post.title}</p>
                        <p className="text-xs text-gray-400 font-mono truncate mt-0.5">{post.slug}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {CATEGORY_MAP[post.categoryId] ?? '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${sc.cls}`}>{sc.label}</span>
                      </td>
                      <td className="px-5 py-3 max-w-[160px]">
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
                          ))}
                          {post.tags.length > 3 && <span className="text-[10px] text-gray-400">+{post.tags.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{post.authorName}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatRelativeTime(post.updatedAt)}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => void togglePublish(post)}
                            className={`text-xs font-medium whitespace-nowrap ${
                              post.status === 'published' ? 'text-gray-500 hover:text-gray-700' : 'text-green-600 hover:text-green-700'
                            }`}
                          >
                            {post.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => setEditing(post)}
                            className="text-xs text-amber-600 hover:text-amber-700 font-medium inline-flex items-center gap-1"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          <button
                            onClick={() => void handleDelete(post)}
                            className="text-xs text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
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

      {editing !== null && (
        <PostEditor post={editing} saving={saving} onSave={handleSave} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
