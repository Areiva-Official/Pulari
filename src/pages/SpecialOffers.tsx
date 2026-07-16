import { useEffect, useMemo, useState } from 'react';
import { Tag, Clock, Users, Star, Loader2, AlertCircle } from 'lucide-react';
import SEO from '../components/SEO';
import { offersApi } from '../lib/api';
import type { SpecialOffer } from '../types';

interface SpecialOffersProps {
  onNavigate: (page: string) => void;
}

export default function SpecialOffers({ onNavigate }: SpecialOffersProps) {
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      const response = await offersApi.getActive();
      if (cancelled) return;
      if (response.error) {
        setError(response.error);
        setOffers([]);
      } else {
        setOffers(response.data ?? []);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasOffers = offers.length > 0;
  const introText = useMemo(
    () =>
      hasOffers
        ? 'Explore our current limited-time offers and signature dining deals, managed live from the admin panel.'
        : 'We are refreshing our offers right now. Browse the full menu or check back shortly for new dining deals.',
    [hasOffers]
  );

  const formatWindow = (offer: SpecialOffer) => {
    if (offer.validFrom && offer.validUntil) return `${offer.validFrom} – ${offer.validUntil}`;
    if (offer.validFrom) return `From ${offer.validFrom}`;
    if (offer.validUntil) return `Until ${offer.validUntil}`;
    return 'Available now';
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <SEO
        title="Special Offers & Deals"
        description="Great value deals at Pulari Restaurant, Temple Street Dublin. Lunch specials from €12.99, early bird dinners, family feasts and weekend brunch platters. Authentic Kerala cuisine at unbeatable prices."
        canonical="/special-offers"
        keywords="Indian restaurant Dublin deals, Kerala food Dublin offers, lunch special Dublin, Indian restaurant Temple Street offer, cheap Indian food Dublin, Kerala restaurant deals Ireland"
        breadcrumbs={[{ name: 'Special Offers', url: '/special-offers' }]}
      />

      {/* Hero */}
      <section
        className="relative h-72 flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 text-center text-white px-4">
          <span className="inline-block bg-amber-500 text-white text-sm font-bold px-4 py-1 rounded-full mb-4 uppercase tracking-wide">
            Limited Time
          </span>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Special Offers</h1>
          <p className="text-xl text-amber-200">
            Exceptional Kerala cuisine at unbeatable value
          </p>
        </div>
      </section>

      {/* Offers Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Today's Deals</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            At Pulari Restaurant on Temple Street, Dublin 2, we believe authentic Kerala food should be
            accessible to everyone. {introText}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-amber-700">
            <Loader2 size={28} className="animate-spin mr-3" /> Loading offers...
          </div>
        ) : error ? (
          <div className="max-w-2xl mx-auto mb-16 rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-red-700 flex items-start gap-3">
            <AlertCircle size={22} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Could not load offers.</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : hasOffers ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className={`bg-gradient-to-r ${offer.color} p-6 text-white`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                      {offer.badge}
                    </span>
                    <h3 className="text-2xl font-bold mt-3">{offer.title}</h3>
                    <p className="text-white/80 text-sm mt-1">{offer.subtitle}</p>
                  </div>
                  <span className="text-3xl font-black">{offer.price}</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold mb-3">
                  <Clock size={16} />
                  <span>{formatWindow(offer)}</span>
                </div>
                <p className="text-gray-600 leading-relaxed">{offer.description}</p>
                <button
                  onClick={() => onNavigate('menu')}
                  className="mt-5 w-full bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700 transition-colors"
                >
                  Order from Menu →
                </button>
              </div>
            </div>
            ))}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto mb-16 rounded-3xl bg-white p-10 text-center shadow-sm border border-amber-100">
            <Tag className="mx-auto text-amber-500 mb-4" size={40} />
            <h3 className="text-2xl font-bold text-gray-800 mb-3">No offers are live right now</h3>
            <p className="text-gray-600 mb-6">
              The offers page is now connected to the admin panel, so new promotions will appear here automatically.
            </p>
            <button
              onClick={() => onNavigate('menu')}
              className="bg-amber-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-amber-700 transition-colors"
            >
              Browse Full Menu
            </button>
          </div>
        )}

        {/* SEO Content Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Why Dine at Pulari Restaurant, Dublin?
          </h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Pulari Restaurant opened its doors in 2025 under the passionate vision of Mr. Bijukuttan, bringing
            the authentic flavours of Kerala and South India to Dublin city centre. Located on Temple Street,
            Dublin 2, we quickly became a beloved destination for both the Indian community in Ireland and
            Irish food lovers eager to discover something new.
          </p>
          <p className="text-gray-600 leading-relaxed mb-8">
            Our special offers make it easier than ever to enjoy a genuine Kerala dining experience without
            stretching your budget. From our popular weekday lunch specials to our family feast, every deal is
            designed to let you explore the full richness of our menu at exceptional value.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-amber-100 p-4 rounded-full mb-4">
                <Tag className="text-amber-600" size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Great Value</h3>
              <p className="text-gray-600 text-sm">
                Authentic Kerala and South Indian food in Dublin at prices that won't break the bank. Our
                lunch specials and early bird offers are among the best value in Dublin city centre.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-amber-100 p-4 rounded-full mb-4">
                <Star className="text-amber-600" size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Authentic Flavours</h3>
              <p className="text-gray-600 text-sm">
                Founded by Mr. Bijukuttan with deep Kerala roots, every dish at Pulari is made from
                traditional family recipes using premium spices sourced directly from Kerala, India.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-amber-100 p-4 rounded-full mb-4">
                <Users className="text-amber-600" size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Perfect for Groups</h3>
              <p className="text-gray-600 text-sm">
                Our Family Feast and Weekend Brunch Platter make Pulari the ideal choice for family dinners,
                casual group outings, and celebrations at our Temple Street location.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-amber-600 to-amber-800 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Taste Kerala in Dublin?</h2>
          <p className="text-amber-100 mb-8 text-lg">
            Visit us at Crow St, Temple Bar, Dublin — open 7 days, 12PM–9PM (10PM Fri &amp; Sat).
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('menu')}
              className="bg-white text-amber-700 px-8 py-3 rounded-full font-bold hover:bg-amber-50 transition-colors"
            >
              Browse Menu
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white/10 transition-colors"
            >
              Contact Us
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
