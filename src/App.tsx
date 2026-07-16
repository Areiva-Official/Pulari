import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { formatHoursLines, telHref } from './lib/restaurantSettings';
import { trackPageView } from './lib/analytics';
import AdminApp from './admin/AdminApp';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import About from './pages/About';
import Menu from './pages/Menu';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Account from './pages/Account';
import Cart from './pages/Cart';
import SpecialOffers from './pages/SpecialOffers';
import KeralaFood from './pages/KeralaFood';
import VegetarianMenu from './pages/VegetarianMenu';
import Blog from './pages/Blog';
import { MessageCircle } from 'lucide-react';

const pathToPage: Record<string, string> = {
  '/admin': 'admin',
  '/': 'home',
  '/about': 'about',
  '/menu': 'menu',
  '/contact': 'contact',
  '/login': 'login',
  '/account': 'account',
  '/cart': 'cart',
  '/special-offers': 'special-offers',
  '/kerala-cuisine': 'kerala-cuisine',
  '/vegetarian': 'vegetarian',
  '/blog': 'blog',
};

const pageToPath: Record<string, string> = {
  'admin': '/admin',
  'home': '/',
  'about': '/about',
  'menu': '/menu',
  'contact': '/contact',
  'login': '/login',
  'account': '/account',
  'cart': '/cart',
  'special-offers': '/special-offers',
  'kerala-cuisine': '/kerala-cuisine',
  'vegetarian': '/vegetarian',
  'blog': '/blog',
};

function AppInner() {
  const [currentPage, setCurrentPage] = useState(() => {
    const mapped = pathToPage[window.location.pathname];
    // Only allow /admin if user is authenticated; otherwise fall back to home
    if (mapped === 'admin') return 'admin';
    return mapped || 'home';
  });

  const { settings } = useSettings();
  const hoursLines = formatHoursLines(settings.openingHours);

  // Update URL and scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const newPath = pageToPath[currentPage] || '/';
    if (window.location.pathname !== newPath) {
      window.history.pushState({ page: currentPage }, '', newPath);
    }
    trackPageView(newPath);
  }, [currentPage]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const page = e.state?.page || pathToPage[window.location.pathname] || 'home';
      setCurrentPage(page);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleWhatsAppChat = () => {
    // Format phone number for WhatsApp (digits only, with country code)
    const phoneNumber = (settings.whatsapp || '353830681518').replace(/[^\d]/g, '');
    const message = encodeURIComponent('Hello! I would like to inquire about your menu.');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'admin':
        return null; // handled separately below
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'about':
        return <About />;
      case 'menu':
        return <Menu onNavigate={setCurrentPage} />;

      case 'contact':
        return <Contact />;
      case 'login':
        return <Login onNavigate={setCurrentPage} />;
      case 'account':
        return <Account onNavigate={setCurrentPage} />;
      case 'cart':
        return <Cart onNavigate={setCurrentPage} />;
      case 'special-offers':
        return <SpecialOffers onNavigate={setCurrentPage} />;
      case 'kerala-cuisine':
        return <KeralaFood onNavigate={setCurrentPage} />;
      case 'vegetarian':
        return <VegetarianMenu onNavigate={setCurrentPage} />;
      case 'blog':
        return <Blog onNavigate={setCurrentPage} />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  // Admin panel — full-page takeover, no public nav/footer
  if (currentPage === 'admin') {
    return <AdminApp onExitAdmin={() => setCurrentPage('home')} />;
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-white">
        <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
        {renderPage()}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4 text-amber-500">Pulari Restaurant</h3>
                <p className="text-gray-400">
                  Authentic Kerala and South Indian cuisine in the heart of Dublin city centre. Founded in 2025 by Mr. Bijukuttan.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li><button onClick={() => setCurrentPage('about')} className="text-gray-400 hover:text-white transition-colors">About Us</button></li>
                  <li><button onClick={() => setCurrentPage('menu')} className="text-gray-400 hover:text-white transition-colors">Menu</button></li>
                  <li><button onClick={() => setCurrentPage('special-offers')} className="text-gray-400 hover:text-amber-400 transition-colors">Special Offers</button></li>
                  <li><button onClick={() => setCurrentPage('kerala-cuisine')} className="text-gray-400 hover:text-white transition-colors">Kerala Cuisine</button></li>
                  <li><button onClick={() => setCurrentPage('vegetarian')} className="text-gray-400 hover:text-white transition-colors">Vegetarian Menu</button></li>
                  <li><button onClick={() => setCurrentPage('blog')} className="text-gray-400 hover:text-white transition-colors">Blog</button></li>
                  <li><button onClick={() => setCurrentPage('contact')} className="text-gray-400 hover:text-white transition-colors">Contact</button></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Contact</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>{settings.address.line1}</li>
                  <li>{[settings.address.city, settings.address.postcode].filter(Boolean).join(', ')}</li>
                  <li><a href={telHref(settings)} className="hover:text-white transition-colors">{settings.phone}</a></li>
                  <li><a href={`mailto:${settings.email}`} className="hover:text-white transition-colors">{settings.email}</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Hours</h4>
                <ul className="space-y-2 text-gray-400">
                  {hoursLines.map((line) => (
                    <li key={line.days}>{line.days}: {line.time}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2026 Pulari Restaurant. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {/* Floating Chat Button - Positioned to avoid blocking checkout bar on mobile */}
        <button
          onClick={handleWhatsAppChat}
          className="fixed bottom-24 md:bottom-6 right-6 bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4 rounded-full shadow-2xl hover:from-amber-700 hover:to-amber-800 transform hover:scale-110 transition-all duration-300 z-40 group"
          aria-label="Chat with us"
        >
          <MessageCircle size={28} className="animate-pulse group-hover:animate-none" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
            1
          </span>
        </button>
        </div>
      </CartProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppInner />
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
