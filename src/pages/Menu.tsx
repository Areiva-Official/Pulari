import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Leaf, Wheat } from 'lucide-react';

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
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    const { data: categoriesData } = await supabase
      .from('menu_categories')
      .select('*')
      .order('display_order');

    if (categoriesData) {
      const categoriesWithItems = await Promise.all(
        categoriesData.map(async (category) => {
          const { data: items } = await supabase
            .from('menu_items')
            .select('*')
            .eq('category_id', category.id)
            .eq('is_available', true);

          return {
            ...category,
            items: items || [],
          };
        })
      );

      setCategories(categoriesWithItems);
    }
    setLoading(false);
  };

  const sampleMenu = [
    {
      id: '1',
      name: 'Starters',
      description: 'Begin your culinary journey',
      items: [
        {
          id: '1',
          name: 'Irish Oysters',
          description: 'Fresh Galway Bay oysters with mignonette',
          price: 18,
          image_url: 'https://images.pexels.com/photos/566345/pexels-photo-566345.jpeg?auto=compress&cs=tinysrgb&w=600',
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: true,
        },
        {
          id: '2',
          name: 'Soup of the Day',
          description: 'Chef\'s daily creation with artisan bread',
          price: 12,
          image_url: 'https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg?auto=compress&cs=tinysrgb&w=600',
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '3',
          name: 'Smoked Salmon',
          description: 'Irish smoked salmon with capers and dill cream',
          price: 16,
          image_url: 'https://images.pexels.com/photos/3535383/pexels-photo-3535383.jpeg?auto=compress&cs=tinysrgb&w=600',
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: true,
        },
      ],
    },
    {
      id: '2',
      name: 'Main Courses',
      description: 'Signature dishes prepared with care',
      items: [
        {
          id: '4',
          name: 'Grilled Ribeye',
          description: 'Premium Irish beef with peppercorn sauce and vegetables',
          price: 35,
          image_url: 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=600',
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: true,
        },
        {
          id: '5',
          name: 'Pan-Seared Salmon',
          description: 'Atlantic salmon with lemon butter and seasonal vegetables',
          price: 28,
          image_url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600',
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: true,
        },
        {
          id: '6',
          name: 'Mushroom Risotto',
          description: 'Creamy arborio rice with wild mushrooms and truffle oil',
          price: 24,
          image_url: 'https://images.pexels.com/photos/1438672/pexels-photo-1438672.jpeg?auto=compress&cs=tinysrgb&w=600',
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: true,
        },
        {
          id: '7',
          name: 'Lamb Shank',
          description: 'Slow-braised Irish lamb with rosemary jus',
          price: 32,
          image_url: 'https://images.pexels.com/photos/8753647/pexels-photo-8753647.jpeg?auto=compress&cs=tinysrgb&w=600',
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: true,
        },
      ],
    },
    {
      id: '3',
      name: 'Desserts',
      description: 'Sweet endings to remember',
      items: [
        {
          id: '8',
          name: 'Chocolate Fondant',
          description: 'Warm chocolate cake with vanilla ice cream',
          price: 12,
          image_url: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=600',
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '9',
          name: 'Irish Cream Cheesecake',
          description: 'Classic cheesecake with Baileys',
          price: 10,
          image_url: 'https://images.pexels.com/photos/140831/pexels-photo-140831.jpeg?auto=compress&cs=tinysrgb&w=600',
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: false,
        },
        {
          id: '10',
          name: 'Seasonal Fruit Tart',
          description: 'Fresh fruit on almond cream with pastry',
          price: 11,
          image_url: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=600',
          is_vegetarian: true,
          is_vegan: false,
          is_gluten_free: false,
        },
      ],
    },
  ];

  const displayMenu = categories.length > 0 ? categories : sampleMenu;

  return (
    <div className="min-h-screen pt-24 bg-gray-50">
      <section
        className="relative h-80 flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-6xl font-bold mb-4 animate-fade-in">Our Menu</h1>
          <p className="text-2xl animate-fade-in-delay">Crafted with passion, served with pride</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : (
          displayMenu.map((category, categoryIndex) => (
            <div key={category.id} className="mb-20">
              <div className="text-center mb-12 animate-fade-in">
                <h2 className="text-4xl font-bold text-gray-800 mb-3">{category.name}</h2>
                <p className="text-xl text-gray-600">{category.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {category.items.map((item, itemIndex) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up"
                    style={{ animationDelay: `${itemIndex * 100}ms` }}
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="relative w-full sm:w-48 h-48 overflow-hidden group">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-2xl font-semibold text-gray-800">{item.name}</h3>
                          <span className="text-2xl font-bold text-amber-600">€{item.price}</span>
                        </div>
                        <p className="text-gray-600 mb-3 leading-relaxed">{item.description}</p>
                        <div className="flex space-x-2">
                          {item.is_vegetarian && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              <Leaf size={14} className="mr-1" />
                              Vegetarian
                            </span>
                          )}
                          {item.is_vegan && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              <Leaf size={14} className="mr-1" />
                              Vegan
                            </span>
                          )}
                          {item.is_gluten_free && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                              <Wheat size={14} className="mr-1" />
                              GF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
