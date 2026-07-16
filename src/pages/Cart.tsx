import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { couponsApi } from '../lib/api';
import { Trash2, Plus, Minus, ShoppingBag, ChevronRight, Leaf, Wheat, AlertCircle, Phone, ExternalLink } from 'lucide-react';

interface CartProps {
  onNavigate: (page: string) => void;
}

export default function Cart({ onNavigate }: CartProps) {
  const {
    items,
    removeFromCart,
    updateQuantity,
    updateSpecialInstructions,
    clearCart,
    getCartCount,
    getSubtotal,
    couponCode,
    setCouponCode,
  } = useCart();

  const [promoCode, setPromoCode] = useState(couponCode ?? '');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setPromoChecking(true);
    setPromoError(null);
    const res = await couponsApi.validate(code, getSubtotal());
    setPromoChecking(false);
    if (res.error || !res.data) {
      setCouponCode(null);
      setPromoError(res.error ?? 'Invalid or expired code.');
      return;
    }
    // Valid — store the code; the server re-validates and applies it at checkout.
    setCouponCode(code);
  };

  const handleRemovePromo = () => {
    setCouponCode(null);
    setPromoCode('');
    setPromoError(null);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pt-20 sm:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            <div className="inline-block p-6 bg-white rounded-full shadow-xl mb-6 animate-bounce">
              <ShoppingBag size={64} className="text-amber-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 mb-4">
              Your Cart is Empty
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-md mx-auto">
              Looks like you haven't added any delicious items yet. Explore our menu!
            </p>
            <button
              onClick={() => onNavigate('menu')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-amber-700 hover:to-amber-800 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
            >
              Browse Menu
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pt-20 sm:pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 bg-clip-text text-transparent mb-2">
                Shopping Cart
              </h1>
              <p className="text-gray-600 text-lg">
                {getCartCount()} {getCartCount() === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
            <button
              onClick={clearCart}
              className="hidden sm:flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold transition-colors duration-300 px-4 py-2 rounded-lg hover:bg-red-50"
            >
              <Trash2 size={20} />
              Clear Cart
            </button>
          </div>
          <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-6">
                  {/* Image */}
                  <div className="relative w-full sm:w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center">
                        <ShoppingBag size={48} className="text-amber-600" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>
                        
                        {/* Dietary Tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.is_vegetarian && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              <Leaf size={12} className="mr-1" />
                              Vegetarian
                            </span>
                          )}
                          {item.is_vegan && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              <Leaf size={12} className="mr-1" />
                              Vegan
                            </span>
                          )}
                          {item.is_gluten_free && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                              <Wheat size={12} className="mr-1" />
                              GF
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-bold text-amber-600">
                          €{(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">€{item.price.toFixed(2)} each</p>
                      </div>
                    </div>

                    {/* Special Instructions */}
                    <div className="mb-3">
                      <textarea
                        placeholder="Special instructions (e.g., no onions, extra spicy)"
                        value={item.special_instructions || ''}
                        onChange={(e) => updateSpecialInstructions(item.id, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                        rows={2}
                      />
                    </div>

                    {/* Quantity Controls and Remove */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-700">Quantity:</span>
                        <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-amber-100 text-amber-600 font-bold transition-colors duration-200 shadow-sm"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-bold text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-amber-100 text-amber-600 font-bold transition-colors duration-200 shadow-sm"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Continue Shopping */}
            <button
              onClick={() => onNavigate('menu')}
              className="w-full flex items-center justify-center gap-2 text-amber-700 hover:text-amber-800 font-semibold py-4 rounded-xl hover:bg-white transition-all duration-300 border-2 border-dashed border-amber-300 hover:border-amber-500"
            >
              <Plus size={20} />
              Add More Items
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24 space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-4 border-b-2 border-amber-200">
                Order Summary
              </h2>

              {/* Promo Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    disabled={!!couponCode}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent uppercase disabled:bg-gray-100"
                  />
                  {couponCode ? (
                    <button
                      onClick={handleRemovePromo}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={handleApplyPromo}
                      disabled={promoChecking}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors duration-200 disabled:opacity-60"
                    >
                      {promoChecking ? 'Checking…' : 'Apply'}
                    </button>
                  )}
                </div>
                {couponCode && (
                  <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle size={14} />
                    Code “{couponCode}” applied — discount shown at checkout.
                  </p>
                )}
                {promoError && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {promoError}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 py-4 border-y-2 border-gray-100">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-semibold">€{getSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2">
                  <span>Total</span>
                  <span className="text-amber-600">€{getSubtotal().toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-400">Prices include VAT</p>
              </div>

              {/* Order Now — opens delivery partners modal */}
              <button
                onClick={() => setShowCheckout(true)}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-4 rounded-xl font-bold text-lg hover:from-amber-700 hover:to-amber-800 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <ShoppingBag size={20} />
                Order Now
              </button>

              {/* Order Info */}
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
                <p>
                  Order via Deliveroo, Uber Eats, Just Eat or call us directly for pickup
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal - Order Methods */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-scale-in">
            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-amber-100 rounded-full mb-4">
                <ShoppingBag size={48} className="text-amber-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                Choose Your Order Method
              </h2>
              <p className="text-gray-600">
                Select how you'd like to complete your order
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {/* Deliveroo */}
              <button
                onClick={() => {
                  window.open('https://deliveroo.ie/menu/Dublin/city-hall/gala-temple-bar?day=today&geohash=gc7x3rhhv3ed&time=ASAP', '_blank');
                }}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-teal-600 font-bold text-lg">D</span>
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Order on Deliveroo</div>
                    <div className="text-xs text-teal-100">Fast delivery to your door</div>
                  </div>
                </div>
                <ExternalLink size={20} />
              </button>

              {/* Uber Eats */}
              <button
                onClick={() => {
                  window.open('https://www.ubereats.com/ie/store/pulari-desi/Z1s5JKUHXWuM7Qg9pPxCcA?diningMode=DELIVERY&sc=SEARCH_SUGGESTION', '_blank');
                }}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold text-lg">U</span>
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Order on Uber Eats</div>
                    <div className="text-xs text-green-100">Quick delivery service</div>
                  </div>
                </div>
                <ExternalLink size={20} />
              </button>

              {/* Just Eat */}
              <button
                onClick={() => {
                  window.open('https://www.just-eat.ie/restaurants-pulari-authentic-desi-kitchen-dublin', '_blank');
                }}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-orange-500 font-bold text-lg">JE</span>
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Order on Just Eat</div>
                    <div className="text-xs text-orange-100">Delivery to your door</div>
                  </div>
                </div>
                <ExternalLink size={20} />
              </button>

              {/* Call for Pickup */}
              <button
                onClick={() => {
                  window.location.href = 'tel:+353830681518';
                }}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <Phone size={20} className="text-amber-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Call for Pickup</div>
                    <div className="text-xs text-amber-100">083 068 1518</div>
                  </div>
                </div>
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="border-t pt-4">
              <button
                onClick={() => setShowCheckout(false)}
                className="w-full text-gray-600 hover:text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
