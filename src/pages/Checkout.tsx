// ─────────────────────────────────────────────────────────────────────────────
// CHECKOUT — collection order + card payment (Stripe)
// Flow:  details → create order (server-priced) → PaymentIntent → PaymentElement
//        → success.  3-D Secure (SCA) redirects return here and are reconciled
//        via the payment_intent_client_secret URL param.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import type { Appearance, StripeElementsOptions } from '@stripe/stripe-js';
import {
  ShoppingBag,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Phone,
  ExternalLink,
  CreditCard,
  Info,
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ordersApi, paymentsApi, settingsApi, isApiConfigured } from '../lib/api';
import { getStripe, hasStripeKey, formatEuro } from '../lib/stripe';
import type { Order } from '../types';
import PaymentForm from '../components/checkout/PaymentForm';
import MockPaymentForm from '../components/checkout/MockPaymentForm';

interface CheckoutProps {
  onNavigate: (page: string) => void;
}

type Step = 'loading' | 'details' | 'payment' | 'success' | 'unavailable';

const appearance: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#d97706',
    colorText: '#1f2937',
    borderRadius: '10px',
    fontFamily: 'system-ui, sans-serif',
  },
};

export default function Checkout({ onNavigate }: CheckoutProps) {
  const { items, getSubtotal, getCartCount, couponCode, clearCart } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>('loading');
  const [demo, setDemo] = useState(false);
  const [publishableKey, setPublishableKey] = useState<string>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [order, setOrder] = useState<Order | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [successOrderNumber, setSuccessOrderNumber] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const returnUrl = `${window.location.origin}/checkout`;

  // ── Init: load Stripe key from settings; handle 3-D Secure return ──────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Prefill from the signed-in user.
      if (user?.email) setEmail((e) => e || (user.email as string));

      // No live backend (local mock build) → render the designed checkout in
      // DEMO mode so the full flow is previewable offline. No real charge is
      // ever taken; the payment step shows a placeholder card form.
      if (!isApiConfigured()) {
        if (!cancelled) {
          setDemo(true);
          setStep('details');
        }
        return;
      }

      // Resolve the publishable key (settings → env fallback).
      let key = '';
      try {
        const res = await settingsApi.get();
        key = res.data?.stripePublishableKey ?? '';
      } catch {
        /* ignore — fall back to env */
      }
      if (cancelled) return;
      setPublishableKey(key);

      if (!hasStripeKey(key)) {
        setStep('unavailable');
        return;
      }

      // 3-D Secure redirect return?
      const params = new URLSearchParams(window.location.search);
      const returnedSecret = params.get('payment_intent_client_secret');
      if (returnedSecret) {
        const stripe = await getStripe(key);
        if (stripe) {
          const { paymentIntent } = await stripe.retrievePaymentIntent(returnedSecret);
          // Clean the URL so a refresh doesn't reprocess.
          window.history.replaceState({}, '', '/checkout');
          if (
            paymentIntent &&
            (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')
          ) {
            const pendingNumber = sessionStorage.getItem('pulari_pending_order_number');
            sessionStorage.removeItem('pulari_pending_order_number');
            setSuccessOrderNumber(pendingNumber);
            clearCart();
            if (!cancelled) setStep('success');
            return;
          }
        }
      }

      if (!cancelled) setStep('details');
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stripePromise = useMemo(
    () => (publishableKey ? getStripe(publishableKey) : null),
    [publishableKey]
  );

  const elementsOptions: StripeElementsOptions | null = clientSecret
    ? { clientSecret, appearance }
    : null;

  const validateDetails = (): string | null => {
    if (!name.trim()) return 'Please enter your name.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return 'Please enter a valid email.';
    if (phone.trim().replace(/\D/g, '').length < 7) return 'Please enter a valid phone number.';
    if (items.length === 0) return 'Your cart is empty.';
    return null;
  };

  // Build a local, display-only order for DEMO mode (no backend call).
  const buildLocalOrder = (): Order => {
    const sub = getSubtotal();
    const ts = new Date().toISOString();
    return {
      id: 'demo',
      orderNumber: `PUL-DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: name.trim(),
      customerEmail: email.trim(),
      customerPhone: phone.trim(),
      type: 'collection',
      status: 'pending',
      paymentStatus: 'pending',
      items: items.map((i) => ({
        id: i.id,
        menuItemId: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        specialInstructions: i.special_instructions,
        subtotal: Number((i.price * i.quantity).toFixed(2)),
      })),
      subtotal: sub,
      taxAmount: 0,
      discountAmount: 0,
      serviceCharge: 0,
      total: sub,
      couponCode: couponCode ?? undefined,
      createdAt: ts,
      updatedAt: ts,
    };
  };

  const handleContinueToPayment = async () => {
    const err = validateDetails();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);

    // DEMO mode: skip the backend, build a local order, show the mock card form.
    if (demo) {
      setOrder(buildLocalOrder());
      setStep('payment');
      return;
    }

    setSubmitting(true);

    // 1) Create the order — the server re-prices everything authoritatively.
    const orderRes = await ordersApi.create({
      customerName: name.trim(),
      customerEmail: email.trim(),
      customerPhone: phone.trim(),
      type: 'collection',
      items: items.map((i) => ({
        menuItemId: i.id,
        quantity: i.quantity,
        specialInstructions: i.special_instructions,
      })),
      couponCode: couponCode ?? undefined,
    });

    if (orderRes.error || !orderRes.data) {
      setSubmitting(false);
      setFormError(orderRes.error ?? 'Could not create your order. Please try again.');
      return;
    }
    const createdOrder = orderRes.data;
    setOrder(createdOrder);

    // 2) Create the PaymentIntent for exactly order.total.
    const intentRes = await paymentsApi.createPaymentIntent({
      orderId: createdOrder.id,
      customerEmail: email.trim(),
    });

    setSubmitting(false);

    if (intentRes.status === 503) {
      setStep('unavailable');
      return;
    }
    if (intentRes.error || !intentRes.data?.clientSecret) {
      setFormError(intentRes.error ?? 'Could not start payment. Please try again.');
      return;
    }

    setClientSecret(intentRes.data.clientSecret);
    sessionStorage.setItem('pulari_pending_order_number', createdOrder.orderNumber);
    setStep('payment');
  };

  const handlePaymentSuccess = () => {
    setSuccessOrderNumber(order?.orderNumber ?? null);
    clearCart();
    setStep('success');
  };

  // ── RENDER ────────────────────────────────────────────────────────────────

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pt-24 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-amber-600" />
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pt-24 pb-12">
        <div className="max-w-xl mx-auto px-4 text-center">
          <div className="inline-block p-5 bg-green-100 rounded-full mb-6">
            <CheckCircle2 size={56} className="text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Payment Successful</h1>
          <p className="text-lg text-gray-600 mb-2">
            Thank you! Your collection order has been received.
          </p>
          {successOrderNumber && (
            <p className="text-gray-700 mb-8">
              Order reference:{' '}
              <span className="font-bold text-amber-700">{successOrderNumber}</span>
            </p>
          )}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 text-left">
            <p className="text-gray-700 flex items-center gap-2">
              <Phone size={18} className="text-amber-600" />
              We'll have your order ready for collection at Temple Street, Dublin 2.
            </p>
          </div>
          <button
            onClick={() => onNavigate('menu')}
            className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-8 py-4 rounded-full font-bold hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  if (step === 'unavailable') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pt-24 pb-12">
        <div className="max-w-xl mx-auto px-4">
          <button
            onClick={() => onNavigate('cart')}
            className="flex items-center gap-1 text-amber-700 hover:text-amber-800 font-semibold mb-6"
          >
            <ChevronLeft size={20} /> Back to Cart
          </button>
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-block p-4 bg-amber-100 rounded-full mb-4">
              <ShoppingBag size={40} className="text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Order for Collection or Delivery</h1>
            <p className="text-gray-600 mb-6">
              Online card payment isn't available right now — order through one of these instead:
            </p>
            <div className="space-y-3">
              <a
                href="https://deliveroo.ie/menu/Dublin/city-hall/gala-temple-bar"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-4 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-semibold transition-all"
              >
                <span>Order on Deliveroo</span>
                <ExternalLink size={18} />
              </a>
              <a
                href="https://www.ubereats.com/ie/store/pulari-desi/Z1s5JKUHXWuM7Qg9pPxCcA"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all"
              >
                <span>Order on Uber Eats</span>
                <ExternalLink size={18} />
              </a>
              <a
                href="https://www.just-eat.ie/restaurants-pulari-authentic-desi-kitchen-dublin"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-semibold transition-all"
              >
                <span>Order on Just Eat</span>
                <ExternalLink size={18} />
              </a>
              <a
                href="tel:+353830681518"
                className="w-full flex items-center justify-between p-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-all"
              >
                <span>Call for Pickup · 083 068 1518</span>
                <Phone size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // details + payment share the order-summary column
  const displayTotal = order ? order.total : subtotal;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => (step === 'payment' ? setStep('details') : onNavigate('cart'))}
          className="flex items-center gap-1 text-amber-700 hover:text-amber-800 font-semibold mb-6"
        >
          <ChevronLeft size={20} /> {step === 'payment' ? 'Back to Details' : 'Back to Cart'}
        </button>

        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-700 to-amber-600 bg-clip-text text-transparent mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: form / payment */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
              {step === 'details' && (
                <>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">Collection Details</h2>
                  <p className="text-sm text-gray-500 mb-6">
                    We'll prepare your order for collection at Temple Street, Dublin 2.
                  </p>
                  {demo && (
                    <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800 mb-6">
                      <Info size={18} className="flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Design preview.</strong> Stripe isn't connected yet, so
                        this runs in demo mode — walk through the full checkout without a
                        real payment.
                      </span>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Full name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="087 123 4567"
                      />
                    </div>
                  </div>

                  {formError && (
                    <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 mt-4">
                      <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleContinueToPayment}
                    disabled={submitting}
                    className="mt-6 w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-4 rounded-xl font-bold text-lg hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" /> Preparing payment…
                      </>
                    ) : (
                      <>
                        <CreditCard size={20} /> Continue to Payment
                      </>
                    )}
                  </button>
                </>
              )}

              {step === 'payment' && demo && (
                <>
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Payment</h2>
                  <MockPaymentForm
                    amountLabel={formatEuro(displayTotal)}
                    onSuccess={handlePaymentSuccess}
                  />
                </>
              )}

              {step === 'payment' && !demo && stripePromise && elementsOptions && (
                <>
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Payment</h2>
                  <Elements stripe={stripePromise} options={elementsOptions} key={clientSecret}>
                    <PaymentForm
                      amountLabel={formatEuro(displayTotal)}
                      returnUrl={returnUrl}
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                </>
              )}
            </div>
          </div>

          {/* Right: order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b-2 border-amber-200">
                Order Summary
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {getCartCount()} {getCartCount() === 1 ? 'item' : 'items'} · Collection
              </p>

              <div className="space-y-2 max-h-64 overflow-auto mb-4">
                {items.map((i) => (
                  <div key={i.id} className="flex justify-between text-sm text-gray-700">
                    <span className="truncate pr-2">
                      {i.quantity}× {i.name}
                    </span>
                    <span className="font-semibold whitespace-nowrap">
                      {formatEuro(i.price * i.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 py-4 border-y border-gray-100">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatEuro(order ? order.subtotal : subtotal)}</span>
                </div>
                {order && order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                    <span className="font-semibold">−{formatEuro(order.discountAmount)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-xl font-bold text-gray-900 pt-4">
                <span>Total</span>
                <span className="text-amber-600">{formatEuro(displayTotal)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Prices include VAT</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
