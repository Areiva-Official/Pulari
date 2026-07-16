import { useEffect, useState } from 'react';
import { Calendar, Clock, ArrowRight, User, Loader2, BookOpen } from 'lucide-react';
import SEO from '../components/SEO';
import { blogApi } from '../lib/api';
import type { BlogPost } from '../types';

interface BlogProps {
  onNavigate: (page: string) => void;
}

// Admin-managed category ids → friendly labels shown on the public site.
const CATEGORY_LABELS: Record<string, string> = {
  bc1: 'Food & Culture',
  bc2: 'Recipes & Tips',
  bc3: 'Restaurant News',
};

const DEFAULT_IMAGE =
  'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function postDateIso(post: BlogPost): string {
  return post.publishedAt ?? post.createdAt;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function categoryOf(post: BlogPost): string {
  return CATEGORY_LABELS[post.categoryId] ?? post.tags?.[0] ?? 'Article';
}

function imageOf(post: BlogPost): string {
  return post.featuredImageUrl?.trim() ? post.featuredImageUrl : DEFAULT_IMAGE;
}

function readTimeOf(post: BlogPost): string {
  return `${post.readingTimeMinutes || 3} min read`;
}

// Lightweight markdown renderer — supports ## headings, **bold** paragraphs,
// inline **bold**, and plain paragraphs. Mirrors the content authored in admin.
function renderContent(content: string) {
  return content
    .trim()
    .split('\n\n')
    .map((block, i) => {
      if (block.startsWith('## ')) {
        return (
          <h2 key={i} className="text-2xl font-bold text-gray-800 mt-10 mb-4">
            {block.replace('## ', '')}
          </h2>
        );
      }
      if (block.startsWith('**') && block.endsWith('**') && !block.slice(2, -2).includes('**')) {
        return (
          <p key={i} className="font-bold text-gray-800 mb-4">
            {block.replace(/\*\*/g, '')}
          </p>
        );
      }
      const parts = block.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className="text-gray-700 leading-relaxed mb-4">
          {parts.map((part, j) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={j}>{part.replace(/\*\*/g, '')}</strong>
            ) : (
              part
            )
          )}
        </p>
      );
    });
}

export default function Blog({ onNavigate }: BlogProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await blogApi.list({ pageSize: 100 });
      if (!active) return;
      if (res.error) {
        setError(res.error);
        setPosts([]);
      } else {
        setPosts(res.data?.items ?? []);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // ─── DETAIL VIEW ─────────────────────────────────────────────────────────
  if (selectedPost) {
    const isoDate = postDateIso(selectedPost);
    const category = categoryOf(selectedPost);
    const image = imageOf(selectedPost);

    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: selectedPost.title,
      description: selectedPost.excerpt,
      image,
      datePublished: isoDate,
      author: { '@type': 'Person', name: selectedPost.authorName },
      publisher: {
        '@type': 'Restaurant',
        name: 'Pulari Restaurant',
        url: 'https://www.pulari.ie',
      },
      mainEntityOfPage: `https://www.pulari.ie/blog/${selectedPost.slug}`,
    };

    return (
      <div className="min-h-screen bg-white pt-24">
        <SEO
          title={selectedPost.metaTitle || selectedPost.title}
          description={selectedPost.metaDescription || selectedPost.excerpt}
          canonical={`/blog/${selectedPost.slug}`}
          ogImage={image}
          type="article"
          articleDate={isoDate}
          articleAuthor={selectedPost.authorName}
          jsonLd={articleSchema}
          breadcrumbs={[{ name: 'Blog', url: '/blog' }, { name: category, url: `/blog/${selectedPost.slug}` }]}
        />
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => setSelectedPost(null)}
            className="flex items-center gap-2 text-amber-600 font-semibold mb-8 hover:text-amber-700 transition-colors"
          >
            ← Back to Blog
          </button>

          <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
            {category}
          </span>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {selectedPost.title}
          </h1>

          <div className="flex items-center gap-6 text-gray-500 text-sm mb-8 border-b border-gray-100 pb-6">
            <span className="flex items-center gap-2">
              <Calendar size={16} /> {formatDate(isoDate)}
            </span>
            <span className="flex items-center gap-2">
              <Clock size={16} /> {readTimeOf(selectedPost)}
            </span>
            <span className="flex items-center gap-2">
              <User size={16} /> {selectedPost.authorName}
            </span>
          </div>

          <img
            src={image}
            alt={selectedPost.featuredImageAlt || selectedPost.title}
            className="w-full h-64 sm:h-80 object-cover rounded-2xl mb-10"
          />

          <div className="prose prose-lg max-w-none">{renderContent(selectedPost.content)}</div>

          <div className="mt-12 bg-amber-50 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Ready to Experience Kerala in Dublin?
            </h3>
            <p className="text-gray-600 mb-6">
              Visit Pulari Restaurant at Crow St, Temple Bar, Dublin. Open daily —
              12PM–9PM (10PM Fri &amp; Sat).
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('menu')}
                className="bg-amber-600 text-white px-8 py-3 rounded-full font-bold hover:bg-amber-700 transition-colors"
              >
                Browse Menu
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="border-2 border-amber-600 text-amber-600 px-8 py-3 rounded-full font-bold hover:bg-amber-50 transition-colors"
              >
                Contact Us
              </button>
            </div>
          </div>
        </article>
      </div>
    );
  }

  // ─── LIST VIEW ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <SEO
        title="Blog | Kerala Food, Dublin Dining & South Indian Culture"
        description="Explore the Pulari Restaurant blog — guides to Kerala cuisine, vegetarian Indian food in Dublin, biryani recipes, and tips for discovering authentic South Indian food in Ireland."
        canonical="/blog"
        keywords="Kerala food blog, Indian food Dublin, South Indian cuisine guide, Kerala restaurant Dublin blog, authentic Indian food Ireland"
        breadcrumbs={[{ name: 'Blog', url: '/blog' }]}
      />

      {/* Hero */}
      <section
        className="relative h-64 flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl font-bold mb-3">Our Blog</h1>
          <p className="text-xl text-amber-200">
            Stories, guides, and insights from Pulari Restaurant
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Latest Articles</h2>
          <p className="text-lg text-gray-600">
            Exploring Kerala cuisine, South Indian food culture, and what's happening at Pulari
            Restaurant, Dublin.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 size={36} className="animate-spin mb-3" />
            <p className="text-sm">Loading articles…</p>
          </div>
        ) : error ? (
          <div className="max-w-xl mx-auto text-center bg-white rounded-2xl border border-red-100 p-10">
            <p className="text-red-600 font-medium mb-2">We couldn't load the blog right now.</p>
            <p className="text-gray-500 text-sm">Please refresh the page or check back shortly.</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="max-w-xl mx-auto text-center bg-white rounded-2xl border border-gray-100 p-12">
            <BookOpen size={40} className="mx-auto mb-4 text-amber-300" />
            <p className="text-gray-700 font-semibold mb-1">No articles yet</p>
            <p className="text-gray-500 text-sm">
              We're cooking up some great stories. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
                onClick={() => setSelectedPost(post)}
              >
                <div className="relative overflow-hidden h-52">
                  <img
                    src={imageOf(post)}
                    alt={post.featuredImageAlt || post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {categoryOf(post)}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 text-gray-400 text-xs mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {formatDate(postDateIso(post))}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {readTimeOf(post)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">{post.excerpt}</p>
                  <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm">
                    Read Article <ArrowRight size={16} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* SEO content */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">About This Blog</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            The Pulari Restaurant blog is your guide to Kerala cuisine, South Indian food culture, and the
            story behind Dublin's most authentic Kerala restaurant. Founded in 2025 by Mr. Bijukuttan in
            Temple Bar, Dublin, Pulari has become a beloved destination for authentic South Indian
            dining in Ireland.
          </p>
          <p className="text-gray-600 leading-relaxed">
            We publish regular articles covering everything from deep dives into specific Kerala dishes like
            Malabar biryani and appam, to guides for vegetarians and vegans exploring South Indian cuisine
            for the first time. Bookmark this page and check back regularly for new posts.
          </p>
        </div>
      </section>
    </div>
  );
}
