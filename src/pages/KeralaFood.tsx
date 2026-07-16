import { Leaf, ChefHat, MapPin, Star } from 'lucide-react';
import SEO from '../components/SEO';

interface KeralaFoodProps {
  onNavigate: (page: string) => void;
}

export default function KeralaFood({ onNavigate }: KeralaFoodProps) {
  const dishes = [
    {
      name: 'Malabar Chicken Biryani',
      description:
        'Aromatic Kerala-style biryani with tender chicken, basmati rice, and a blend of whole spices slow-cooked in the Malabar tradition.',
      tag: 'Signature',
    },
    {
      name: 'House Boat Fish Curry',
      description:
        'A traditional Kerala fish curry simmered in fresh coconut milk with raw mango and spices. Inspired by the famous Kerala backwaters.',
      tag: 'Bestseller',
    },
    {
      name: 'Appam',
      description:
        'Soft, lacy rice hoppers with a crispy edge served with your choice of curry. A beloved Kerala breakfast classic.',
      tag: 'Traditional',
    },
    {
      name: 'Kappa Puzhukku',
      description:
        'Tapioca cooked Kerala style with fresh coconut, turmeric, and spices. A comforting dish from the heartland of Kerala.',
      tag: 'Kerala Classic',
    },
    {
      name: 'Hi Range Beef Ularthiyathu',
      description:
        'Slow-cooked beef with coconut pieces, curry leaves, and spices from the High Ranges of Kerala. Bold, aromatic, and unforgettable.',
      tag: "Chef's Pick",
    },
    {
      name: 'Neyy Choru',
      description:
        'Fragrant ghee rice cooked with whole spices — a Kerala staple traditionally served at festivals and special occasions.',
      tag: 'Festive',
    },
  ];

  return (
    <div className="min-h-screen bg-white pt-24">
      <SEO
        title="Kerala Cuisine in Dublin | Authentic South Indian Food"
        description="Discover authentic Kerala cuisine at Pulari Restaurant, Temple Street Dublin. Malabar biryani, appam, fish curry, beef ularthiyathu and more — the true flavours of Kerala in Ireland."
        canonical="/kerala-cuisine"
        keywords="Kerala cuisine Dublin, South Indian food Dublin, Kerala restaurant Ireland, Malabar food Dublin, authentic Indian food Dublin, Kerala dishes Dublin, South Indian restaurant Temple Street"
        breadcrumbs={[{ name: 'Kerala Cuisine', url: '/kerala-cuisine' }]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What is Kerala cuisine?',
              acceptedAnswer: { '@type': 'Answer', text: 'Kerala cuisine is the traditional food of Kerala, a coastal state in southwest India. It is characterised by the use of coconut, curry leaves, black pepper, and tamarind. Signature dishes include appam, dosa, fish curry, biryani, and beef ularthiyathu.' },
            },
            {
              '@type': 'Question',
              name: 'Where can I find authentic Kerala food in Dublin?',
              acceptedAnswer: { '@type': 'Answer', text: 'Pulari Restaurant on Crow Street, Temple Bar, Dublin serves authentic Kerala and South Indian cuisine. The restaurant is open seven days a week — Monday to Thursday and Sunday 12PM to 9PM, and Friday to Saturday 12PM to 10PM.' },
            },
            {
              '@type': 'Question',
              name: 'Is Kerala food spicy?',
              acceptedAnswer: { '@type': 'Answer', text: 'Kerala food can range from mildly spiced to very hot. Dishes like appam and set dosa are quite mild, while preparations like Kottayam chicken fry and beef ularthiyathu use more black pepper and chillies. We can adjust spice levels on request.' },
            },
            {
              '@type': 'Question',
              name: 'Does Pulari serve vegetarian Kerala food?',
              acceptedAnswer: { '@type': 'Answer', text: 'Yes. Pulari Restaurant has an extensive vegetarian menu including dosas, samosas, medu vada, banana fry, paneer butter masala, and kappa puzhukku. Many dishes are also vegan.' },
            },
          ],
        }}
      />

      {/* Hero */}
      <section
        className="relative h-80 flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        }}
      >
        <div className="absolute inset-0 bg-black/55"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Kerala Cuisine</h1>
          <p className="text-xl text-amber-200">
            The authentic taste of God's Own Country, right here in Dublin
          </p>
        </div>
      </section>

      {/* What is Kerala Cuisine */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-gray-800 mb-6">What is Kerala Cuisine?</h2>
        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          Kerala, known as "God's Own Country," is a coastal state in South India celebrated for its
          extraordinarily rich culinary heritage. Kerala cuisine is defined by its generous use of coconut
          in all forms — fresh coconut, coconut milk, and coconut oil — along with a unique blend of whole
          spices including cardamom, cinnamon, cloves, black pepper, and turmeric. The abundant coastline
          means that fish and seafood feature prominently alongside rice, the beloved staple grain.
        </p>
        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          Unlike the tandoor-heavy cooking traditions of North India, Kerala cuisine is slow-cooked and
          simmered to perfection, allowing complex layers of flavour to develop naturally. Dishes like fish
          molee (coconut milk fish curry), appam (fermented rice hoppers), and Kerala beef ularthiyathu
          (dry-roasted beef with coconut) are globally celebrated for their depth of flavour and authentic
          character.
        </p>
        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          At Pulari Restaurant on Crow Street, Temple Bar, Dublin, our founder Mr. Bijukuttan brings the authentic
          cooking traditions of Kerala to Ireland. Having mastered the art of traditional Kerala cooking
          from generations of family recipes, he uses authentic techniques and rare spice blends that
          transport diners straight to the backwaters and spice gardens of Kerala.
        </p>
        <p className="text-lg text-gray-700 leading-relaxed">
          Whether you're an Irish food lover eager to discover South Indian cuisine, or part of Dublin's
          vibrant Malayali community seeking an authentic taste of home, Pulari offers a Kerala dining
          experience unlike any other restaurant in Dublin. Our menu is a love letter to Kerala — its
          flavours, its culture, and its people.
        </p>
      </section>

      {/* Featured Kerala Dishes */}
      <section className="py-16 bg-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-800 text-center mb-4">
            Our Kerala Specialities
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Signature dishes straight from the heart of Kerala — now available in Dublin
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dishes.map((dish, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                  {dish.tag}
                </span>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{dish.name}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{dish.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button
              onClick={() => onNavigate('menu')}
              className="bg-amber-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-amber-700 transition-colors"
            >
              View Full Menu
            </button>
          </div>
        </div>
      </section>

      {/* The Story of Kerala Food */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Kerala Food Culture: A Tradition Built on Spice and Community
        </h2>
        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          Kerala's position along the ancient spice trade routes shaped its cuisine profoundly. Arab, Portuguese,
          Dutch, and British traders all left their mark on Kerala's flavour profile, which is why you'll find
          influences from across the world in traditional Kerala recipes. The Malabar region in northern Kerala
          developed its own distinct biryani tradition, blending Indian and Arab cooking techniques into the
          now-famous Malabar biryani — one of our most popular dishes at Pulari.
        </p>
        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          Kerala's Hindu, Muslim (Mappila), and Christian communities each contributed unique recipes to the
          state's culinary tapestry. The Mappila community gifted Kerala its spiced meat dishes and biryanis.
          The Christian community is renowned for its bold beef and pork preparations. And Kerala's Hindu
          traditions produced an incredible array of vegetarian dishes centred on coconut and rice.
        </p>
        <p className="text-lg text-gray-700 leading-relaxed">
          At Pulari, we honour all these traditions by offering a menu that spans the full breadth of Kerala
          cuisine — from hearty meat dishes and aromatic biryanis to delicate vegetarian preparations and
          refreshing beverages like filter coffee and mango lassi. When you dine with us, you're experiencing
          the full story of Kerala on one table.
        </p>
      </section>

      {/* Why choose us */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-800 text-center mb-12">
            Why Pulari for Kerala Food in Dublin?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: <ChefHat size={36} />,
                title: 'Authentic Recipes',
                text: "Mr. Bijukuttan's family recipes, unchanged and uncompromised — genuine Kerala cooking in every bite.",
              },
              {
                icon: <Leaf size={36} />,
                title: 'Traditional Spices',
                text: 'We source authentic Kerala spices for genuine, complex flavour that you simply cannot find elsewhere in Dublin.',
              },
              {
                icon: <MapPin size={36} />,
                title: 'Heart of Dublin',
                text: 'Located on Crow Street in Temple Bar, Dublin — easy to reach from anywhere in the city, impossible to forget once visited.',
              },
              {
                icon: <Star size={36} />,
                title: 'Loved by Customers',
                text: "A growing favourite among Dublin's Indian and Malayali community and Irish food lovers discovering Kerala for the first time.",
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-amber-600 flex justify-center mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Experience Kerala in Dublin</h2>
          <p className="text-gray-400 mb-8">
            Open Mon–Thu &amp; Sun: 12–9 PM · Fri–Sat: 12–10 PM · Crow St, Temple Bar, Dublin
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
              className="border border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white/10 transition-colors"
            >
              Get Directions
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
