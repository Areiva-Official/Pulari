import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus, Mail, Phone, ShieldCheck, RotateCcw, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface LoginProps {
  onNavigate: (page: string) => void;
}

// ─── Step machine ──────────────────────────────────────────────────────────────
type Step = 'form' | 'verify-email' | 'success';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function Login({ onNavigate }: LoginProps) {
  const { signIn, signUp, confirmEmail, resendConfirmationCode } = useAuth();

  // ── mode ──────────────────────────────────────────────────────────────────
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState<Step>('form');

  // ── form fields ───────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',       // optional, E.164 e.g. +353861234567
  });
  const [showPassword, setShowPassword] = useState(false);

  // ── OTP / verification ────────────────────────────────────────────────────
  const [otpCode, setOtpCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');

  // ── status ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── cooldown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const fullOtpCode = otpCode.join('');

  function handleOtpInput(idx: number, val: string) {
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...otpCode];
    next[idx] = char;
    setOtpCode(next);
    if (char && idx < OTP_LENGTH - 1) {
      otpRefs.current[idx + 1]?.focus();
    }
    // auto-submit when all filled
    if (char && idx === OTP_LENGTH - 1) {
      const code = [...next].join('');
      if (code.length === OTP_LENGTH) handleVerifyEmail(code);
    }
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpCode[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((c, i) => { next[i] = c; });
    setOtpCode(next);
    otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    if (pasted.length === OTP_LENGTH) handleVerifyEmail(pasted);
  }

  function formatPhone(raw: string) {
    // strip non-digits / '+' and auto-prefix +353 for Irish numbers
    const clean = raw.replace(/[^\d+]/g, '');
    if (clean.startsWith('0') && clean.length >= 2) return '+353' + clean.slice(1);
    return clean;
  }

  // ─── Submit handlers ───────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const phone = formData.phone.trim() ? formatPhone(formData.phone) : undefined;
        const { error, needsConfirmation } = await signUp(formData.email, formData.password, formData.fullName, phone);
        if (error) {
          setError(error.message);
        } else if (needsConfirmation) {
          setStep('verify-email');
          setResendCooldown(RESEND_COOLDOWN);
        }
      } else {
        const { error, needsConfirmation } = await signIn(formData.email, formData.password);
        if (needsConfirmation) {
          // account exists but was never confirmed — jump to OTP step
          setIsSignUp(true);
          setStep('verify-email');
          setResendCooldown(RESEND_COOLDOWN);
        } else if (error) {
          setError(error.message);
        } else {
          onNavigate('home');
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }

    setLoading(false);
  }

  async function handleVerifyEmail(code = fullOtpCode) {
    if (code.length < OTP_LENGTH) return;
    setLoading(true);
    setError('');

    try {
      const { error } = await confirmEmail(formData.email, code);
      if (error) {
        setError(error.message);
        setOtpCode(Array(OTP_LENGTH).fill(''));
        otpRefs.current[0]?.focus();
      } else {
        setStep('success');
        setTimeout(() => onNavigate('home'), 1800);
      }
    } catch {
      setError('Verification failed. Please try again.');
    }

    setLoading(false);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError('');
    setResendMessage('');
    const { error } = await resendConfirmationCode(formData.email);
    if (error) {
      setError(error.message);
    } else {
      setResendMessage('A new code has been sent to your email.');
      setResendCooldown(RESEND_COOLDOWN);
      setOtpCode(Array(OTP_LENGTH).fill(''));
      otpRefs.current[0]?.focus();
    }
  }

  // ─── Render helpers ────────────────────────────────────────────────────────
  const bannerTitle = step === 'verify-email' ? 'Verify Your Email'
    : step === 'success' ? 'You\'re In!'
    : isSignUp ? 'Create Account' : 'Welcome Back';

  const bannerSub = step === 'verify-email' ? 'Enter the code we sent you'
    : step === 'success' ? 'Redirecting you now…'
    : isSignUp ? 'Join the Pulari family' : 'Sign in to your account';

  // ─── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-24 bg-gray-50">
      {/* Hero banner */}
      <section
        className="relative h-72 flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: 'url(https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1920)' }}
      >
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl font-bold mb-3 animate-fade-in">{bannerTitle}</h1>
          <p className="text-xl animate-fade-in-delay">{bannerSub}</p>
        </div>
      </section>

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">

          {/* ── SUCCESS ── */}
          {step === 'success' && (
            <div className="text-center py-6">
              <CheckCircle className="mx-auto text-green-500 mb-4" size={56} />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Confirmed!</h2>
              <p className="text-gray-600">Taking you home…</p>
            </div>
          )}

          {/* ── OTP VERIFICATION ── */}
          {step === 'verify-email' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
                  <ShieldCheck className="text-amber-600" size={36} />
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Check your email</h2>
              <p className="text-sm text-gray-500 text-center mb-2">
                We sent a 6-digit code to
              </p>
              <p className="text-center font-semibold text-amber-700 mb-6 flex items-center justify-center gap-1">
                <Mail size={15} /> {formData.email}
              </p>
              {formData.phone.trim() && (
                <p className="text-center text-xs text-gray-400 mb-5 flex items-center justify-center gap-1">
                  <Phone size={12} /> SMS backup to {formatPhone(formData.phone)} — enabled once your account activates
                </p>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm text-center">{error}</p>
                </div>
              )}
              {resendMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm text-center">{resendMessage}</p>
                </div>
              )}

              {/* 6-digit OTP boxes */}
              <div className="flex justify-center gap-2 mb-6" onPaste={handleOtpPaste}>
                {otpCode.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-14 text-center text-xl font-bold border-2 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                    style={{ borderColor: digit ? '#d97706' : undefined }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleVerifyEmail()}
                disabled={loading || fullOtpCode.length < OTP_LENGTH}
                className="w-full bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 mb-4"
              >
                {loading ? 'Verifying…' : 'Confirm Email'}
              </button>

              {/* Resend */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="inline-flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 disabled:text-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  <RotateCcw size={14} />
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => { setStep('form'); setError(''); setOtpCode(Array(OTP_LENGTH).fill('')); }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
                >
                  ← Back to sign up
                </button>
              </div>
            </>
          )}

          {/* ── SIGN IN / SIGN UP FORM ── */}
          {step === 'form' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
                  {isSignUp
                    ? <UserPlus className="text-amber-600" size={32} />
                    : <LogIn className="text-amber-600" size={32} />}
                </div>
              </div>

              {error && (
                <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {isSignUp && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all"
                      placeholder="e.g. Priya Sharma"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Mobile number <span className="font-normal text-gray-400">(optional — for order SMS updates)</span>
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all"
                        placeholder="083 123 4567 or +353 83 123 4567"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all"
                      placeholder="••••••••••••"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {isSignUp && (
                    <p className="mt-1.5 text-xs text-gray-400">
                      Min. 12 characters recommended — use a mix of letters, numbers & symbols.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-600 text-white py-3.5 rounded-xl font-semibold text-base hover:bg-amber-700 active:scale-98 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-amber-200"
                >
                  {loading ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              {isSignUp && (
                <p className="mt-4 text-xs text-gray-400 text-center">
                  After sign-up we'll email you a 6-digit verification code (OTP) to confirm your account.
                </p>
              )}

              <div className="mt-6 text-center border-t border-gray-100 pt-5">
                <button
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); setFormData({ email: '', password: '', fullName: '', phone: '' }); }}
                  className="text-amber-600 hover:text-amber-700 font-semibold text-sm transition-colors"
                >
                  {isSignUp ? 'Already have an account? Sign in →' : "Don't have an account? Sign up →"}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
