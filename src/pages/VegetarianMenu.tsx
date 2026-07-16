import { Leaf } from 'lucide-react';
import SEO from '../components/SEO';

interface VegetarianMenuProps {
  onNavigate: (page: string) => void;
}

export default function VegetarianMenu({ onNavigate }: VegetarianMenuProps) {
  const vegItems = [
    {
      name: 'Samosas',
      description: 'Handmade pastry stuffed with spiced potatoes and green peas. Served with chutneys.',
      price: '€4.99',
      category: 'Starter',
      isVegan: true,
    },
    {
      name: 'Medu Vada',
      description: 'Classic South Indian lentil fritters, crispy outside and fluffy inside, served with homemade chutney.',
      price: '€5.99',
      category: 'Starter',
      isVegan: true,
    },
    {
      name: 'Banana Fry',
      description: 'Golden crispy Kerala banana fritters — soft and sweet inside, perfectly spiced.',
      price: '€5.99',
      category: 'Starter',
      isVegan: true,
    },
    {
      name: 'Nadan Masala Omelette',
      description: 'Kerala-style omelette made with onions, turmeric, and green chillies. A classic brunch dish.',
      price: '€6.99',
      category: 'Starter',
      isVegan: false,
    },
    {
      name: 'Ghee Roast Dosa',
      description: 'Classic crispy South Indian dosa roasted with golden ghee until perfectly crunchy.',
      price: '€11.50',
      category: 'Dosa',
      isVegan: false,
    },
    {
      name: 'Masala Dosa',
      description: 'Crispy rice and lentil crepe filled with spiced potato masala. A South Indian icon.',
      price: '€11.99',
      category: 'Dosa',
      isVegan: false,
    },
    {
      name: 'Set Dosa',
      description: 'A set of soft, pillowy dosas served with sambar and coconut chutney.',
      price: '€11.50',
      category: 'Dosa',
      isVegan: false,
    },
    {
      name: 'Paneer Butter Masala',
      description: 'Cottage cheese cubes in a rich, creamy tomato and butter sauce. A North Indian classic with Kerala spices.',
      price: '€14.99',
      category: 'Main',
      isVegan: false,
    },
    {
      name: 'Kappa Puzhukku',
      description: 'Kerala-style tapioca cooked with fresh coconut, turmeric, and spices. Wholesome and satisfying.',
      price: '€11.99',
      category: 'Main',
      isVegan: true,
    },
    {
      name: 'Kerala Paratha',
      description: 'Flaky, layered South Indian flatbread — the perfect accompaniment to any curry.',
      price: '€2.00',
      category: 'Breads & Sides',
      isVegan: false,
    },
    {
      name: 'Butter Naan',
      description: 'Soft oven-baked naan generously brushed with butter.',
      price: '€2.00',
      category: 'Breads & Sides',
      isVegan: false,
    },
    {
      name: 'Mango Lassi',
      description: 'Refreshing blended mango and yogurt drink — sweet, creamy, and cooling.',
      price: '€3.50',
      category: 'Drinks',
      isVegan: false,
    },
    {
      name: 'Nadan Chai',
      description: 'Traditional Kerala tea brewed strong with fresh milk and spices.',
      price: '€3.00',
      category: 'Drinks',
      isVegan: false,
    },
    {
      name: 'Gulab Jamun',
      description: 'Soft, spongy Indian milk-solid dumplings soaked in aromatic rose sugar syrup.',
      price: '€4.00',
      category: 'Dessert',
      isVegan: false,
    },
  ];

  const categories = [...new Set(vegItems.map((i) => i.category))];

  return (
    <div className="min-h-screen bg-white pt-24">
      <SEO
        title="Vegetarian Indian Food Dublin | Vegan Kerala Options"
        description="Best vegetarian and vegan Indian food in Dublin at Pulari Restaurant, Temple Street. Kerala dosas, samosas, paneer dishes, and plant-based options. Authentic South Indian vegetarian cuisine."
        canonical="/vegetarian"
        keywords="vegetarian Indian food Dublin, vegan Indian restaurant Dublin, vegetarian Kerala food, vegetarian South Indian Dublin, plant-based Indian food Ireland, vegan dosa Dublin"
        breadcrumbs={[{ name: 'Vegetarian Menu', url: '/vegetarian' }]}
      />

      {/* Hero */}
      <section
        className="relative h-72 flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        }}
      >
        <div className="absolute inset-0 bg-green-900/60"></div>
        <div className="relative z-10 text-center text-white px-4">
          <div className="flex justify-center mb-4">
            <Leaf size={48} className="text-green-300" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Vegetarian Menu</h1>
          <p className="text-xl text-green-200">
            Delicious plant-based Kerala cuisine in the heart of Dublin
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-gray-800 mb-6">
          Vegetarian &amp; Vegan Indian Food in Dublin
        </h2>
        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          Kerala has one of the richest vegetarian culinary traditions in all of India. With a culture deeply
          rooted in using coconut, rice, lentils, and seasonal vegetables, Kerala vegetarian food is
          naturally wholesome, flavourful, and deeply satisfying. At Pulari Restaurant on Temple Street,
          Dublin 2, we celebrate this tradition with a comprehensive vegetarian menu that refuses to
          compromise on authenticity or taste.
        </p>
        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          From crispy samosas and golden medu vada to fragrant masala dosas and rich paneer butter masala,
          our vegetarian options are crafted with the same precision and passion as every other dish on our
          menu. Many of our starters and sides are also fully vegan, making Pulari one of the best choices
          for vegetarian and vegan dining in Dublin city centre.
        </p>
        <p className="text-lg text-gray-700 leading-relaxed">
          Whether you follow a vegetarian or vegan lifestyle, are exploring meatless options, or simply love
          the clean, vibrant flavours of South Indian vegetarian cooking — our menu has something wonderful
          for you. Items marked{' '}
          <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
            <Leaf size={14} /> Vegan
          </span>{' '}
          are completely plant-based.
        </p>
      </section>

      {/* Menu by Category */}
      <section className="py-12 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-800 text-center mb-4">
            Our Vegetarian Selection
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            All dishes below are vegetarian.{' '}
            <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
              <Leaf size={14} /> Vegan
            </span>{' '}
            items are completely plant-based.
          </p>

          {categories.map((category) => (
            <div key={category} className="mb-12">
              <h3 className="text-2xl font-bold text-amber-700 mb-6 border-b-2 border-amber-200 pb-2">
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vegItems
                  .filter((item) => item.category === category)
                  .map((item, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-green-600 bg-green-100 px-2 py-1 rounded-full">
                          Vegetarian
                        </span>
                        {item.isVegan && (
                          <span className="flex items-center gap-1 text-xs font-bold text-green-700">
                            <Leaf size={12} /> Vegan
                          </span>
                        )}
                      </div>
                      <h4 className="text-xl font-bold text-gray-800 mt-2 mb-1">{item.name}</h4>
                      <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                      <span className="text-amber-600 font-bold text-lg">{item.price}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          <div className="text-center mt-6">
            <button
              onClick={() => onNavigate('menu')}
              className="bg-amber-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-amber-700 transition-colors"
            >
              See Full Menu (Including Non-Veg)
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center bg-white">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Dublin's Best Vegetarian Indian Restaurant
          </h2>
          <p className="text-gray-600 mb-8">
            Crow St, Temple Bar, Dublin · Mon–Thu &amp; Sun: 12–9 PM · Fri–Sat: 12–10 PM
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('menu')}
              className="bg-amber-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-amber-700 transition-colors"
            >
              View Full Menu
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="border-2 border-amber-600 text-amber-600 px-10 py-4 rounded-full font-bold text-lg hover:bg-amber-50 transition-colors"
            >
              Find Us
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
