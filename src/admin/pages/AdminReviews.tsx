// ADMIN REVIEWS — Approve, highlight, or remove customer reviews

import { useMemo, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import type { Review } from '../../types';
import { formatRelativeTime, useReviewsAdminData } from '../hooks/useAdminData';

type Tab = 'all' | 'pending' | 'approved';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} className={i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </span>
  );
}

export default function AdminReviews() {
  const { data: reviews, loading, error, approve, highlight, remove } = useReviewsAdminData();
  const [activeTab, setActiveTab] = useState<Tab>('pending');

  const filtered = useMemo<Review[]>(() => {
    if (activeTab === 'pending')  return reviews.filter((r) => !r.isApproved);
    if (activeTab === 'approved') return reviews.filter((r) => r.isApproved);
    return [...reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [activeTab, reviews]);

  const pendingCount = reviews.filter((r) => !r.isApproved).length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pendingCount} pending approval</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'all'] as Tab[]).map((tab) => {
          const count = tab === 'all' ? reviews.length : tab === 'pending' ? reviews.filter((r) => !r.isApproved).length : reviews.filter((r) => r.isApproved).length;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-amber-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading reviews…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Star size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No reviews here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <p className="font-semibold text-gray-800">{review.customerName}</p>
                    <Stars rating={review.rating} />
                    {review.isHighlighted && (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">⭐ Featured</span>
                    )}
                    {review.isApproved ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Published</span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">Pending</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatRelativeTime(review.createdAt)}</p>
                </div>
                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  {!review.isApproved ? (
                    <button
                      onClick={() => void approve(review.id, true)}
                      className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-medium hover:bg-green-200 transition-colors"
                    >
                      Approve
                    </button>
                  ) : (
                    <button
                      onClick={() => void approve(review.id, false)}
                      className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Unpublish
                    </button>
                  )}
                  <button
                    onClick={() => void highlight(review.id, !review.isHighlighted)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${review.isHighlighted ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {review.isHighlighted ? '★ Unfeature' : '☆ Feature'}
                  </button>
                  <button
                    onClick={() => void remove(review.id)}
                    className="text-xs text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
