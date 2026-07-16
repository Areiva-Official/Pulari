// ─────────────────────────────────────────────────────────────────────────────
// MOCK PAYMENT FORM — a DESIGN-ONLY placeholder that mirrors the Stripe card
// field. Used in local demo mode (no Stripe keys) so the checkout flow and
// styling are previewable end-to-end. It NEVER processes a real payment.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Lock, Loader2, CreditCard, Info } from 'lucide-react';

interface MockPaymentFormProps {
  amountLabel: string;
  onSuccess: () => void;
}

export default function MockPaymentForm({ amountLabel, onSuccess }: MockPaymentFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate payment latency for a realistic preview, then advance.
    setTimeout(() => onSuccess(), 900);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Demo banner */}
      <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
        <Info size={18} className="flex-shrink-0 mt-0.5" />
        <span>
          <strong>Design preview.</strong> This is a placeholder — no payment is
          taken. Connect Stripe keys to replace this with the live Stripe card
          field.
        </span>
      </div>

      {/* Card number */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Card number
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            placeholder="4242 4242 4242 4242"
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent tracking-widest"
          />
          <CreditCard
            size={20}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
      </div>

      {/* Expiry + CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Expiry
          </label>
          <input
            type="text"
            placeholder="MM / YY"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">CVC</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="123"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Postcode */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Postal code
        </label>
        <input
          type="text"
          placeholder="D02 XY45"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-4 rounded-xl font-bold text-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Lock size={18} />
            Pay {amountLabel}
          </>
        )}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <Lock size={12} />
        Secured by Stripe · Demo preview
      </p>
    </form>
  );
}
