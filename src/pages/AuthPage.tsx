import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Sparkles, ArrowLeft, AlertCircle, CheckCircle2, ShieldCheck, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { authApi, auth } from '../lib/api';
import { AvatarIcon } from '../components/AvatarIcons';

/* real password rules — matches backend zod schema */
const passwordRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'A lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'An uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'A number', test: (p: string) => /\d/.test(p) },
];

function passwordStrength(pw: string) {
  const met = passwordRules.filter(r => r.test(pw)).length;
  if (met <= 1) return { label: 'Weak', color: 'bg-red-500', width: '20%' };
  if (met === 2) return { label: 'Fair', color: 'bg-orange-500', width: '40%' };
  if (met === 3) return { label: 'Good', color: 'bg-yellow-500', width: '60%' };
  if (met === 4) return { label: 'Strong', color: 'bg-green-500', width: '80%' };
  return { label: 'Excellent', color: 'bg-emerald-400', width: '100%' };
}

/* shared input styling */
const inputClass = (hasError: boolean) =>
  `w-full bg-black/30 border rounded-xl px-4 py-3 outline-none text-white placeholder:text-white/30 transition-all [color-scheme:dark] ${hasError ? 'border-red-500/50 focus:border-red-400/60 focus:ring-2 focus:ring-red-400/20' : 'border-white/15 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20'}`;

/* main auth page */
type AuthView = 'login' | 'register' | 'forgot' | 'reset' | 'verify-success' | 'email-sent';

export default function AuthPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [view, setView] = useState<AuthView>(() => {
    if (search.get('verified') === 'true') return 'verify-success';
    if (search.get('resetToken')) return 'reset';
    return 'login';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [pw, setPw] = useState('');
  const resetToken = search.get('resetToken');

  const strength = useMemo(() => passwordStrength(pw), [pw]);
  const pwRuleMet = (rule: typeof passwordRules[number]) => pw.length > 0 && rule.test(pw);

  const goToLogin = useCallback(() => {
    setView('login'); setError(''); setPw(''); setShowPassword(false);
  }, []);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (view === 'login') {
        const res = await authApi.login({ email, password });
        auth.setTokens(res.accessToken, res.refreshToken);
        auth.setUser({ ...res.user, emailVerified: res.user.emailVerified });
      } else {
        const firstName = formData.get('firstName') as string;
        const lastName = formData.get('lastName') as string;
        if (!firstName?.trim() || !lastName?.trim()) {
          setError('Please fill out all fields.');
          setLoading(false);
          return;
        }
        const res = await authApi.register({ firstName, lastName, email, password });
        auth.setTokens(res.accessToken, res.refreshToken);
        auth.setUser({ ...res.user, emailVerified: res.user.emailVerified });
        setRegisteredEmail(email);
        setView('email-sent');
        setLoading(false);
        return;
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    try {
      await authApi.forgotPassword(email);
      setRegisteredEmail(email);
      setView('email-sent');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirm = formData.get('confirm') as string;
    if (password !== confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    try {
      await authApi.resetPassword(resetToken!, password);
      setView('login');
      setPw('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  /* Resend verification */
  const handleResendVerification = async () => {
    setError('');
    try {
      await authApi.sendVerification();
      setError('');
      toastInfo('Verification email sent');
    } catch {
      toastError('Failed to resend email');
    }
  };

  /* Toast mini-helpers */
  const [toastMsg, setToastMsg] = useState('');
  const toastInfo = (m: string) => { setToastMsg(m); setTimeout(() => setToastMsg(''), 3000); };
  const toastError = (m: string) => { setError(m); };

  /* Success toast banner */
  const successToast = search.get('verified') === 'true' || view === 'verify-success'
    ? 'Email verified! You can now log in.'
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#050507] to-slate-900 text-white font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <button
        onClick={() => navigate('/')}
        className="absolute top-6 sm:top-8 left-6 sm:left-8 flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors z-20"
      >
        <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back to Home</span>
      </button>

      <motion.div
        key={view}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-[440px] bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 sm:p-10 relative z-10 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Sparkles className="w-6 h-6 text-cyan-glow" />
          <span className="text-xl font-semibold tracking-tight text-white">Samjho AI</span>
        </div>

        {/* Success toast from email verify */}
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl p-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{successToast}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ──────────── VERIFICATION SUCCESS ──────────── */}
        {view === 'verify-success' && (
          <div className="text-center space-y-6">
            <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-400" />
            <h1 className="text-2xl font-semibold">Email Verified</h1>
            <p className="text-[#86868b]">Your email has been confirmed. You can now sign in to your account.</p>
            <button onClick={goToLogin} className="w-full bg-white text-black rounded-xl py-3.5 font-semibold hover:scale-[1.02] active:scale-[0.99] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              Go to Login
            </button>
          </div>
        )}

        {/* ──────────── EMAIL SENT (register / forgot) ──────────── */}
        {view === 'email-sent' && (
          <div className="text-center space-y-6">
            <ShieldCheck className="w-16 h-16 mx-auto text-blue-400" />
            <h1 className="text-2xl font-semibold">Check your terminal</h1>
            <p className="text-[#86868b]">A link for <strong className="text-white">{registeredEmail}</strong> has been logged to your dev server console. Copy the link and open it in your browser.</p>
            {registeredEmail && (
              <button onClick={handleResendVerification} className="text-blue-400 text-sm hover:text-blue-300 transition-colors">
                Didn't receive it? Resend
              </button>
            )}
            <button onClick={goToLogin} className="w-full bg-white text-black rounded-xl py-3.5 font-semibold hover:scale-[1.02] active:scale-[0.99] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              Back to Login
            </button>
          </div>
        )}

        {/* ──────────── RESET PASSWORD FORM ──────────── */}
        {view === 'reset' && !resetToken && (
          <div className="text-center space-y-6">
            <p className="text-[#86868b]">No reset token found. Please use the link from your email.</p>
            <button onClick={goToLogin} className="w-full bg-white text-black rounded-xl py-3.5 font-semibold hover:scale-[1.02] active:scale-[0.99] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              Back to Login
            </button>
          </div>
        )}

        {view === 'reset' && resetToken && (
          <>
            <h1 className="text-3xl font-semibold tracking-tight mb-1 text-center text-white">Reset password</h1>
            <p className="text-[#86868b] text-center text-sm mb-8">Choose a new password for your account.</p>

            <AnimatePresence>{error && <ErrorAlert msg={error} />}</AnimatePresence>

            <form className="space-y-4" onSubmit={handleSetNewPassword} noValidate>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="password" placeholder="New password" required className={inputClass(!!error) + ' pr-12'} onChange={(e) => setPw(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {pw && <StrengthMeter strength={strength} />}
              </div>
              <PasswordRuleList pw={pw} />
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="confirm" placeholder="Confirm new password" required className={inputClass(false) + ' pr-12'} />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-white text-black rounded-xl py-3.5 font-semibold hover:scale-[1.02] active:scale-[0.99] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100">
                {loading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Set New Password'}
              </button>
            </form>
          </>
        )}

        {/* ──────────── FORGOT PASSWORD ──────────── */}
        {view === 'forgot' && (
          <>
            <h1 className="text-3xl font-semibold tracking-tight mb-1 text-center text-white">Reset password</h1>
            <p className="text-[#86868b] text-center text-sm mb-8">Enter your email and we'll send you a reset link.</p>
            <AnimatePresence>{error && <ErrorAlert msg={error} />}</AnimatePresence>
            <form className="space-y-4" onSubmit={handleResetRequest} noValidate>
              <input type="email" name="email" placeholder="Email address" required className={inputClass(!!error)} />
              <button type="submit" disabled={loading} className="w-full bg-white text-black rounded-xl py-3.5 font-semibold hover:scale-[1.02] active:scale-[0.99] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100">
                {loading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
            <p className="mt-6 text-center">
              <button onClick={goToLogin} className="text-white text-sm hover:text-blue-400 transition-colors font-medium">
                Back to login
              </button>
            </p>
          </>
        )}

        {/* ──────────── LOGIN / REGISTER ──────────── */}
        {(view === 'login' || view === 'register') && (
          <>
            <h1 className="text-3xl font-semibold tracking-tight mb-1 text-center text-white">
              {view === 'login' ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className="text-[#86868b] text-center text-sm mb-8">
              {view === 'login' ? "Enter your details to access your workspace." : "Sign up to start translating in real-time."}
            </p>

            <AnimatePresence>
              {error && <ErrorAlert msg={error} />}
            </AnimatePresence>

            <AnimatePresence>
              {toastMsg && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm rounded-xl p-3 text-center">
                  {toastMsg}
                </motion.div>
              )}
            </AnimatePresence>

            <form className="space-y-4" onSubmit={handleAuth} noValidate onChange={() => setError('')}>
              {view === 'register' && (
                <div className="flex gap-3">
                  <input type="text" name="firstName" placeholder="First name" required className={inputClass(!!error)} />
                  <input type="text" name="lastName" placeholder="Last name" required className={inputClass(!!error)} />
                </div>
              )}

              <input type="email" name="email" placeholder="Email address" required className={inputClass(!!error)} />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder={view === 'register' ? 'Password (8+ chars, letter, number)' : 'Password'}
                  required
                  className={inputClass(!!error) + ' pr-12'}
                  onChange={(e) => setPw(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {view === 'register' && pw && <StrengthMeter strength={strength} />}
              </div>

              {view === 'register' && (
                <PasswordRuleList pw={pw} />
              )}

              {view === 'login' && !error && (
                <div className="flex justify-end -mt-2">
                  <button type="button" onClick={() => { setView('forgot'); setPw(''); }} className="text-sm text-blue-400/80 hover:text-blue-400 transition-colors font-medium">
                    Forgot password?
                  </button>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-white text-black rounded-xl py-3.5 font-semibold hover:scale-[1.02] active:scale-[0.99] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100">
                {loading
                  ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {view === 'login' ? 'Signing in...' : 'Creating account...'}
                      </span>
                    )
                  : (view === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <p className="mt-8 text-center text-[#86868b] text-sm">
              {view === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => { setView(view === 'login' ? 'register' : 'login'); setError(''); setPw(''); }}
                className="text-white hover:text-blue-400 transition-colors font-medium"
              >
                {view === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}

/* ── small reusable components ──────────────────────────────────────── */

function ErrorAlert({ msg }: { msg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
      animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <span className="text-left">{msg}</span>
      </div>
    </motion.div>
  );
}

function StrengthMeter({ strength }: { strength: { label: string; color: string; width: string } }) {
  return (
    <div className="mt-2 space-y-1">
      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
      </div>
      <p className="text-[11px] text-white/50">{strength.label}</p>
    </div>
  );
}

function PasswordRuleList({ pw }: { pw: string }) {
  return (
    <div className="mt-2 space-y-1">
      {passwordRules.map((rule) => {
        const met = rule.test(pw);
        return (
          <div key={rule.label} className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-emerald-400' : 'text-white/40'}`}>
            <Info className="w-3 h-3 shrink-0" />
            <span>{rule.label}</span>
          </div>
        );
      })}
    </div>
  );
}
