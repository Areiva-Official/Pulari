import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { reviewsApi } from '../lib/api';
import type { Review } from '../types';

interface ReviewsProps {
  onNavigate: (page: string) => void;
}

interface DisplayReview {
  id: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  name: string;
}

export default function Reviews({ onNavigate }: ReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<DisplayReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const sampleReviews: DisplayReview[] = [
    {
      id: '1',
      rating: 5,
      title: 'Outstanding Experience',
      comment: 'Absolutely incredible dining experience! The food was exquisite, service impeccable, and the atmosphere was perfect. Will definitely be returning.',
      created_at: '2025-10-15',
      name: 'Sarah Murphy',
    },
    {
      id: '2',
      rating: 5,
      title: 'Best Restaurant in Dublin',
      comment: 'XYZ never disappoints. The ribeye steak was cooked to perfection and the wine selection is impressive. Highly recommend for special occasions.',
      created_at: '2025-10-10',
      name: 'James O\'Connor',
    },
    {
      id: '3',
      rating: 4,
      title: 'Wonderful Evening',
      comment: 'Great food and lovely staff. The salmon was delicious and the dessert was divine. Only minor issue was the wait time, but it was worth it.',
      created_at: '2025-10-05',
      name: 'Emma Walsh',
    },
    {
      id: '4',
      rating: 5,
      title: 'Perfect for Celebrations',
      comment: 'Celebrated our anniversary here and it was magical. The staff went above and beyond to make our evening special. Thank you XYZ!',
      created_at: '2025-09-28',
      name: 'Michael Byrne',
    },
    {
      id: '5',
      rating: 5,
      title: 'Exceptional Quality',
      comment: 'The attention to detail in every dish is remarkable. You can taste the quality of the ingredients. The mushroom risotto was heavenly!',
      created_at: '2025-09-20',
      name: 'Aoife Kelly',
    },
  ];

  const mapReview = (r: Review): DisplayReview => ({
    id: r.id,
    rating: r.rating,
    title: '',
    comment: r.comment,
    created_at: r.createdAt,
    name: r.customerName || 'Anonymous',
  });

  const loadReviews = async () => {
    setLoading(true);
    const res = await reviewsApi.getApproved();
    const live = (res.data ?? []).map(mapReview);
    // Show live reviews when available; otherwise keep the sample testimonials
    // so the page never looks empty.
    setReviews(live.length > 0 ? live : sampleReviews);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await reviewsApi.getApproved();
      if (!active) return;
      const live = (res.data ?? []).map(mapReview);
      setReviews(live.length > 0 ? live : sampleReviews);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayReviews = reviews;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { onNavigate('login'); return; }
    setSubmitting(true);
    const res = await reviewsApi.submit({
      customerName: user.email || user.username,
      rating: formData.rating as Review['rating'],
      comment: formData.comment,
    });
    setSubmitting(false);
    if (!res.error) {
      setSuccess(true);
      setFormData({ rating: 5, title: '', comment: '' });
      setShowForm(false);
      setTimeout(() => setSuccess(false), 5000);
      void loadReviews();
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={20}
        className={index < rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}
      />
    ));
  };

  const averageRating = displayReviews.length > 0
    ? (displayReviews.reduce((sum, review) => sum + review.rating, 0) / displayReviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="min-h-screen pt-24 bg-gray-50">
      <section
        className="relative h-80 flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-6xl font-bold mb-4 animate-fade-in">Guest Reviews</h1>
          <p className="text-2xl animate-fade-in-delay">What our guests say about us</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center space-x-2 mb-4 animate-fade-in">
            <span className="text-5xl font-bold text-amber-600">{averageRating}</span>
            <div className="flex">{renderStars(Math.round(parseFloat(averageRating)))}</div>
          </div>
          <p className="text-xl text-gray-600 mb-8">
            Based on {displayReviews.length} {displayReviews.length === 1 ? 'review' : 'reviews'}
          </p>

          {success && (
            <div className="max-w-2xl mx-auto mb-8 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
              <p className="text-green-800">
                Thank you for your review! It will be published after approval.
              </p>
            </div>
          )}

          {user && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-amber-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-amber-700 transform hover:scale-105 transition-all duration-300"
            >
              Write a Review
            </button>
          )}

          {!user && (
            <p className="text-gray-600">
              <button
                onClick={() => onNavigate('login')}
                className="text-amber-600 hover:text-amber-700 font-semibold underline"
              >
                Sign in
              </button>{' '}
              to write a review
            </p>
          )}
        </div>

        {showForm && (
          <div className="max-w-2xl mx-auto mb-12 bg-white rounded-lg shadow-xl p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Share Your Experience</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                <div className="flex space-x-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: index + 1 })}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        className={
                          index < formData.rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-gray-300'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                  Review Title
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                  placeholder="Sum up your experience"
                />
              </div>

              <div>
                <label htmlFor="comment" className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Review
                </label>
                <textarea
                  id="comment"
                  required
                  rows={5}
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                  placeholder="Tell us about your dining experience..."
                ></textarea>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 disabled:bg-gray-400 transition-all duration-300"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {displayReviews.map((review, index) => (
              <div
                key={review.id}
                className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex">{renderStars(review.rating)}</div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.title && (
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">{review.title}</h3>
                )}
                <p className="text-gray-600 mb-4 leading-relaxed">{review.comment}</p>
                <p className="text-sm font-semibold text-amber-600">
                  {review.name || 'Anonymous'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
