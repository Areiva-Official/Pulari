import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import About from './pages/About';
import Menu from './pages/Menu';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Account from './pages/Account';
import Cart from './pages/Cart';
import { MessageCircle } from 'lucide-react';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const handleWhatsAppChat = () => {
    // Format phone number for WhatsApp (remove spaces and add country code)
    const phoneNumber = '353879738186'; // Ireland country code 353 + 0879738186
    const message = encodeURIComponent('Hello! I would like to inquire about your menu.');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'about':
        return <About />;
      case 'menu':
        return <Menu />;
      case 'gallery':
        return <Gallery />;
      case 'contact':
        return <Contact />;
      case 'login':
        return <Login onNavigate={setCurrentPage} />;
      case 'account':
        return <Account onNavigate={setCurrentPage} />;
      case 'cart':
        return <Cart onNavigate={setCurrentPage} />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <AuthProvider>
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
                  Experience Dublin's finest cuisine in the heart of the city centre.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li>
                    <button onClick={() => setCurrentPage('about')} className="text-gray-400 hover:text-white transition-colors">
                      About Us
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setCurrentPage('menu')} className="text-gray-400 hover:text-white transition-colors">
                      Menu
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setCurrentPage('gallery')} className="text-gray-400 hover:text-white transition-colors">
                      Gallery
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setCurrentPage('contact')} className="text-gray-400 hover:text-white transition-colors">
                      Contact
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Contact</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>Temple Street</li>
                  <li>Dublin 2, Ireland</li>
                  <li>087 973 8186</li>
                  <li>info@pularirestaurant.ie</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Hours</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>Monday - Sunday</li>
                  <li>11:00 AM - 3:00 AM</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2025 Pulari Restaurant. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {/* Floating Chat Button */}
        <button
          onClick={handleWhatsAppChat}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4 rounded-full shadow-2xl hover:from-amber-700 hover:to-amber-800 transform hover:scale-110 transition-all duration-300 z-50 group"
          aria-label="Chat with us"
        >
          <MessageCircle size={28} className="animate-pulse group-hover:animate-none" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
            1
          </span>
        </button>
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
