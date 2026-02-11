import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Wheat, ShoppingCart, Check } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

// Import menu images
import samosaImage from '../assets/gallery/samosa.jpg';
import meduVadaImage from '../assets/gallery/medu vada.jpg';
import masalaOmeletteImage from '../assets/gallery/masala omlette.jpg';
import kottayamChickenImage from '../assets/gallery/kottayam chicken fry.jpg';
import bananaFryImage from '../assets/gallery/banana fry.jpg';
import venaduKonchuImage from '../assets/gallery/venadu kochu fry.jpg';
import gheeRoastImage from '../assets/gallery/ghee roast.jpg';
import masalaDosaImage from '../assets/gallery/masala dosa.jpg';
import setDosaImage from '../assets/gallery/set dosa.jpg';
import mylaporeEggImage from '../assets/gallery/MYLAPOR EGG ROAST.jpg';
import houseBoatFishImage from '../assets/gallery/HOUSE BOAT FISH CURRY.jpg';
import nadanPothuRoastImage from '../assets/gallery/NADAN POTHU ROAST.jpg';
import hiRangeBeefImage from '../assets/gallery/HI RANGE BEEF ULARTHIYATHU.jpg';
import veetileKozhiImage from '../assets/gallery/VEETTILE KOZHI CURRY.jpg';
import konchuMangoImage from '../assets/gallery/KONCHU MANGO CURRY.jpg';
import malabarChickenImage from '../assets/gallery/MALABAR CHICKEN BIRIYANI.jpg';
import malabarBeefImage from '../assets/gallery/MALABAR BEEF BIRIYANI.jpg';
import kappaPuzhukuImage from '../assets/gallery/KAPPA PUZHUKKU.jpg';
import butterChickenImage from '../assets/gallery/OLD DELHI STYLE BUTTER CHICKEN.jpg';
import paneerButterImage from '../assets/gallery/PANEER BUTTER MASALA.jpg';
import keralaParathaImage from '../assets/gallery/KERALA PARATHA.jpg';
import appamImage from '../assets/gallery/APPAM.jpg';
import butterNaanImage from '../assets/gallery/BUTTER NAAN.jpg';
import neyyChoruImage from '../assets/gallery/NEYY CHORU.jpg';
import steamRiceImage from '../assets/gallery/STEAM RICE.jpg';
import pulaoRiceImage from '../assets/gallery/PULAO RICE.jpg';
import raitaImage from '../assets/gallery/RAITA.jpg';
import mangoLassiImage from '../assets/gallery/MANGO LASSI.jpg';
import gulabJamunImage from '../assets/gallery/GULAB JAMUN.jpg';
import nadanChaiImage from '../assets/gallery/NADAN CHAI.jpg';
import masalaTeaImage from '../assets/gallery/MASALA TEA.jpg';
import cardamomTeaImage from '../assets/gallery/CARDAMOM TEA.jpg';
import filterCoffeeImage from '../assets/gallery/FILTER COFFEE.jpg';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  items: MenuItem[];
}

export default function Menu() {
  const [selectedCategory, setSelectedCategory] = useState('1');
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const { addToCart, items: cartItems } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (item: MenuItem) => {
    addToCart({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.image_url,
      is_vegetarian: item.is_vegetarian,
      is_vegan: item.is_vegan,
      is_gluten_free: item.is_gluten_free,
    });
    
    setAddedItems(prev => new Set(prev).add(item.id));
    setTimeout(() => {
      setAddedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }, 2000);
  };

  const menuCategories: MenuCategory[] = [
    {
      id: '1',
      name: 'APPETIZERS',
      description: 'Traditional starters to begin your journey',
      items: [
        {
          id: '1',
          name: 'SAMOSAS',
          description: 'Handmade pastry stuffed with spiced mashed potatoes and green peas. Served with chickpeas, sweet yoghurt, mint, and tamarind chutneys.',
          price: 4.99,
          image_url: samosaImage,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '2',
          name: 'MEDU VADA',
          description: 'A classic South Indian street food made with lentils and spices, served with homemade chutney.',
          price: 5.99,
          image_url: meduVadaImage,
          is_vegetarian: true,
          is_vegan: true,
          is_gluten_free: false,
        },
        {
          id: '3',
          name: 'NADAN MASALA OMELETTE',
          description: 'A Kerala-style omelette made with onions, turmeric, and chillies — a great way to spice up brunch.',
          price: 6.99,
          image_url: masalaOmeletteImage,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '4',
          name: 'KOTTAYAM CHICKEN FRY',
          description: 'On-the-bone chicken marinated with chilli, coriander, and garam masala, served with mixed salad leaves.',
          price: 7.99,
          image_url: kottayamChickenImage,
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '5',
          name: 'BANANA FRY',
          description: 'A traditional Kerala snack — golden, crispy banana fritters that are soft and sweet inside.',
          price: 5.99,
          image_url: bananaFryImage,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '6',
          name: 'VENADU KONCHU FRY',
          description: 'Prawns cooked with hand-pounded spices, onions, ginger, and garlic.',
          price: 7.99,
          image_url: venaduKonchuImage,
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: false,
        },
      ],
    },
    {
      id: '2',
      name: 'DOSAS',
      description: 'Traditional South Indian crepes',
      items: [
        {
          id: '7',
          name: 'GHEE ROAST',
          description: 'Crispy dosa roasted with ghee.',
          price: 11.50,
          image_url: gheeRoastImage,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '8',
          name: 'MASALA DOSA',
          description: 'Crispy rice crepe filled with spiced potato masala.',
          price: 11.99,
          image_url: masalaDosaImage,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '9',
          name: 'SET DOSA',
          description: 'Soft, fluffy dosas served in a set.',
          price: 11.50,
          image_url: setDosaImage,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: false,
        },
      ],
    },
    {
      id: '3',
      name: 'ALL TIME FAVOURITES',
      description: 'Our signature main courses',
      items: [
        {
          id: '10',
          name: 'MYLAPOR EGG ROAST',
          description: 'Hard-boiled eggs cooked with thinly sliced onions, tomatoes, and hand-pounded spices.',
          price: 11.99,
          image_url: mylaporeEggImage,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '11',
          name: 'HOUSE BOAT FISH CURRY',
          description: 'Fresh fish simmered in a spicy, tangy gravy made with Kashmiri chillies, turmeric, tamarind, and Kerala kudampuli.',
          price: 12.99,
          image_url: houseBoatFishImage,
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '12',
          name: 'NADAN POTHU ROAST',
          description: 'Traditional Kerala-style beef cooked with curry leaves, black pepper, fennel seeds, and aromatic spices.',
          price: 13.99,
          image_url: nadanPothuRoastImage,
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '13',
          name: 'HIGH RANGE BEEF ULARTHIYATHU',
          description: 'A classic Toddy Shop-style beef fry. Slow-cooked beef and onions blend with Kerala spices for a rich, dark, flavourful finish.',
          price: 13.99,
          image_url: hiRangeBeefImage,
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '14',
          name: 'VEETTILE KOZHI CURRY',
          description: 'A homestyle Kerala chicken curry cooked on the bone with black pepper, coriander, cinnamon, and cloves.',
          price: 11.99,
          image_url: veetileKozhiImage,
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '15',
          name: 'KONCHU MANGO CURRY',
          description: 'Prawns cooked with coconut, pearl onions, and tangy raw mango.',
          price: 14.99,
          image_url: konchuMangoImage,
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '16',
          name: 'MALABAR CHICKEN BIRIYANI',
          description: 'Aged, aromatic rice layered with tender chicken, cooked in traditional Malabar style.',
          price: 13.50,
          image_url: malabarChickenImage,
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '17',
          name: 'MALABAR BEEF BIRIYANI',
          description: "Slow-cooked beef biryani prepared in the authentic Malabar wedding style — our chef's signature dish.",
          price: 13.99,
          image_url: malabarBeefImage,
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '18',
          name: 'GOPI MANCHURIAN',
          description: 'Crispy cauliflower tossed in a tangy Indo-Chinese garlic-chilli sauce.',
          price: 13.00,
          image_url: '',
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '19',
          name: 'KAPPA PUZHUKKU',
          description: 'A comforting Kerala dish made with mashed tapioca and spices.',
          price: 7.99,
          image_url: kappaPuzhukuImage,
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '20',
          name: 'OLD DELHI STYLE BUTTER CHICKEN',
          description: 'Chicken tikka cooked in a creamy tomato sauce with fenugreek, fresh cream, honey and butter.',
          price: 14.99,
          image_url: butterChickenImage,
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '21',
          name: 'PANEER BUTTER MASALA',
          description: 'Grilled cottage cheese cubes simmered in a rich, creamy, spiced tomato gravy.',
          price: 13.99,
          image_url: paneerButterImage,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: false,
        },
      ],
    },
    {
      id: '4',
      name: 'BREADS & RICE',
      description: 'Perfect accompaniments',
      items: [
        {
          id: '22',
          name: 'KERALA PARATHA',
          description: 'Layered flatbread',
          price: 2.99,
          image_url: keralaParathaImage,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '23',
          name: 'APPAM',
          description: 'Traditional rice pancake',
          price: 2.50,
          image_url: appamImage,
          is_vegetarian: true,
          is_vegan: true,
          is_gluten_free: true,
        },
        {
          id: '24',
          name: 'BUTTER NAAN',
          description: 'Soft leavened bread with butter',
          price: 3.50,
          image_url: butterNaanImage,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '25',
          name: 'NEYY CHORU',
          description: 'Fragrant ghee rice',
          price: 4.50,
          image_url: neyyChoruImage,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: true,
        },
        {
          id: '26',
          name: 'STEAM RICE',
          description: 'Steamed basmati rice',
          price: 3.50,
          image_url: steamRiceImage,
          is_vegetarian: true,
          is_vegan: true,
          is_gluten_free: true,
        },
        {
          id: '27',
          name: 'PULAO RICE',
          description: 'Fragrant spiced rice',
          price: 3.99,
          image_url: pulaoRiceImage,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: true,
        },
        {
          id: '28',
          name: 'RAITA',
          description: 'Yogurt with cucumber and spices',
          price: 3.00,
          image_url: raitaImage,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: true,
        },
      ],
    },
    {
      id: '5',
      name: 'DESSERTS & BEVERAGES',
      description: 'Sweet treats and refreshing drinks',
      items: [
        {
          id: '29',
          name: 'MANGO LASSI',
          description: 'Refreshing mango yogurt drink',
          price: 3.50,
          image_url: mangoLassiImage,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: true,
        },
        {
          id: '30',
          name: 'GULAB JAMUN',
          description: 'Traditional Indian sweet dumplings in syrup',
          price: 4.00,
          image_url: gulabJamunImage,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '31',
          name: 'NADAN CHAI',
          description: 'Traditional Kerala tea',
          price: 3.00,
          image_url: nadanChaiImage,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: true,
        },
        {
          id: '32',
          name: 'MASALA TEA',
          description: 'Aromatic spiced Indian tea',
          price: 3.00,
          image_url: masalaTeaImage,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: true,
        },
        {
          id: '33',
          name: 'CARDAMOM TEA',
          description: 'Aromatic cardamom infused tea',
          price: 3.00,
          image_url: cardamomTeaImage,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: true,
        },
        {
          id: '34',
          name: 'FILTER COFFEE',
          description: 'Traditional South Indian filter coffee',
          price: 3.00,
          image_url: filterCoffeeImage,
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: true,
        },
      ],
    },
  ];

  const selectedCategoryData = menuCategories.find(cat => cat.id === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 pt-16 sm:pt-20">
      {/* Hero Section */}
      <section
        className="relative h-48 sm:h-64 md:h-80 flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-2">Our Menu</h1>
          <p className="text-base sm:text-lg md:text-xl">Authentic Kerala Cuisine</p>
        </div>
      </section>

      {/* Category Tabs */}
      <div className="sticky top-16 sm:top-20 z-30 bg-white border-b shadow-md">
        <div className="max-w-7xl mx-auto overflow-x-auto">
          <div className="flex min-w-max sm:min-w-0 sm:justify-center">
            {menuCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                className={`px-4 py-4 text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50'
                    : 'text-gray-600 hover:text-amber-600 hover:bg-gray-50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {selectedCategoryData && (
          <div>
            {/* Category Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-amber-700 mb-2">
                {selectedCategoryData.name}
              </h2>
              <p className="text-gray-600 text-base sm:text-lg italic">
                {selectedCategoryData.description}
              </p>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {selectedCategoryData.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Image */}
                    <div className="relative w-full sm:w-48 h-48 flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200">
                          <svg className="w-16 h-16 text-amber-400 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 sm:p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 pr-2">
                          {item.name}
                        </h3>
                        <span className="bg-amber-600 text-white px-3 py-1 rounded-full text-lg font-bold whitespace-nowrap">
                          €{item.price.toFixed(2)}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {item.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.is_vegetarian && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                            <Leaf size={12} className="mr-1" />
                            Vegetarian
                          </span>
                        )}
                        {item.is_vegan && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                            <Leaf size={12} className="mr-1" />
                            Vegan
                          </span>
                        )}
                        {item.is_gluten_free && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                            <Wheat size={12} className="mr-1" />
                            GF
                          </span>
                        )}
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => {
                          const isInCart = cartItems.some(cartItem => cartItem.id === item.id);
                          if (isInCart) {
                            navigate('/cart');
                          } else {
                            handleAddToCart(item);
                          }
                        }}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                          addedItems.has(item.id) && !cartItems.some(cartItem => cartItem.id === item.id)
                            ? 'bg-green-500 text-white'
                            : cartItems.some(cartItem => cartItem.id === item.id)
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-amber-600 text-white hover:bg-amber-700'
                        }`}
                      >
                        {addedItems.has(item.id) && !cartItems.some(cartItem => cartItem.id === item.id) ? (
                          <>
                            <Check size={18} />
                            Added to Cart
                          </>
                        ) : cartItems.some(cartItem => cartItem.id === item.id) ? (
                          <>
                            <ShoppingCart size={18} />
                            View Cart
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={18} />
                            Add to Cart
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Allergen Information */}
      <div className="bg-amber-50 border-t-4 border-amber-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg p-6 sm:p-8 shadow-lg">
            <div className="text-center mb-6">
              <div className="inline-block p-3 bg-red-100 rounded-full mb-3">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-red-800 mb-2">
                BE FOOD ALLERGEN AWARE
              </h2>
              <p className="text-base sm:text-lg text-gray-800 font-bold italic mb-4">
                "YOUR SAFETY MATTERS, INFORM US OF FOOD ALLERGENS OR RESTRICTIONS"
              </p>
            </div>

            <div className="text-center text-gray-700 mb-6 text-sm">
              <p className="mb-2">The food products are manufactured in a facility that also processes allergens.</p>
              <p className="mb-2">May contain allergies.</p>
              <p className="font-bold text-amber-900">Please ask our staff if you require further allergen information.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { num: 1, name: 'Wheat' },
                { num: 2, name: 'Crustaceans' },
                { num: 3, name: 'Eggs' },
                { num: 4, name: 'Fish' },
                { num: 5, name: 'Peanuts' },
                { num: 6, name: 'Soybean' },
                { num: 7, name: 'Dairy' },
                { num: 8, name: 'Nuts' },
                { num: 9, name: 'Celery' },
                { num: 10, name: 'Mustard' },
                { num: 11, name: 'Sesame Seed' },
                { num: 12, name: 'Lupin' },
                { num: 13, name: 'Sulphites' },
                { num: 14, name: 'Molluscs Oyster Sauce' },
              ].map((allergen) => (
                <div
                  key={allergen.num}
                  className="flex items-center bg-white p-2.5 rounded-lg shadow-sm"
                >
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-amber-600 text-white font-bold rounded-full mr-2 text-sm">
                    {allergen.num}
                  </span>
                  <span className="text-gray-800 font-medium text-xs">{allergen.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
