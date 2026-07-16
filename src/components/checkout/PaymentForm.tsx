// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT FORM — renders Stripe PaymentElement and confirms the payment.
// Must be rendered inside <Elements> with a clientSecret. Uses redirect:
// 'if_required' so simple cards stay in-app; 3-D Secure (SCA) cards redirect
// to return_url and are reconciled on the Checkout page when they come back.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Lock, Loader2, AlertCircle } from 'lucide-react';

interface PaymentFormProps {
  amountLabel: string;
  returnUrl: string;
  onSuccess: () => void;
}

export default function PaymentForm({ amountLabel, returnUrl, onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? 'Please check your payment details.');
      setSubmitting(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    });

    if (confirmError) {
      // Card declined, validation, or other immediate error.
      setError(confirmError.message ?? 'Payment could not be completed.');
      setSubmitting(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess();
      return;
    }

    if (paymentIntent && paymentIntent.status === 'processing') {
      // Async method still settling — treat as success; webhook finalises.
      onSuccess();
      return;
    }

    // Any other status (e.g. requires_action handled a redirect already).
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
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

      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
        <Lock size={12} />
        Secured by Stripe · Your card details never touch our servers
      </p>
    </form>
  );
}
