import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sparkles, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    if (!isLogin) {
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;
      if (!firstName?.trim() || !lastName?.trim()) {
        setError('Please fill out all fields.');
        return;
      }
    }

    if (!email?.trim() || !password?.trim()) {
      setError('Please fill out all fields.');
      return;
    }

    localStorage.setItem('isAuthenticated', 'true');
    navigate('/meeting');
  };

  const handleSocialAuth = () => {
    localStorage.setItem('isAuthenticated', 'true');
    navigate('/meeting');
  };

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows matching Landing Page */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#00FFFF]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#FF00FF]/10 rounded-full blur-[120px] pointer-events-none" />

      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 sm:top-8 left-6 sm:left-8 flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors z-20"
      >
        <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back to Home</span>
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[440px] bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 sm:p-10 relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <Sparkles className="w-6 h-6 text-[#00FFFF]" />
          <span className="text-xl font-semibold tracking-tight text-white">Samjho AI</span>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight mb-2 text-center text-white">
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h1>
        <p className="text-[#86868b] text-center text-sm mb-8">
          {isLogin ? "Enter your details to access your workspace." : "Sign up to start translating in real-time."}
        </p>

        <form className="space-y-4" onSubmit={handleAuth} noValidate onChange={() => setError('')}>
          {!isLogin && (
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                name="firstName"
                placeholder="First name" 
                required
                className={`w-full bg-white/5 border ${error ? 'border-red-500/50' : 'border-white/10 focus:border-[#00FFFF]/50'} rounded-xl px-4 py-3 outline-none text-white placeholder:text-white/40 transition-all focus:bg-white/10`}
              />
              <input 
                type="text" 
                name="lastName"
                placeholder="Last name" 
                required
                className={`w-full bg-white/5 border ${error ? 'border-red-500/50' : 'border-white/10 focus:border-[#00FFFF]/50'} rounded-xl px-4 py-3 outline-none text-white placeholder:text-white/40 transition-all focus:bg-white/10`}
              />
            </div>
          )}
          
          <input 
            type="email" 
            name="email"
            placeholder="Email address" 
            required
            className={`w-full bg-white/5 border ${error ? 'border-red-500/50' : 'border-white/10 focus:border-[#00FFFF]/50'} rounded-xl px-4 py-3 outline-none text-white placeholder:text-white/40 transition-all focus:bg-white/10`}
          />
          
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              name="password"
              placeholder="Password" 
              required
              className={`w-full bg-white/5 border ${error ? 'border-red-500/50' : 'border-white/10 focus:border-[#00FFFF]/50'} rounded-xl px-4 py-3 outline-none text-white placeholder:text-white/40 transition-all focus:bg-white/10 pr-12`}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-3 text-center">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" className="w-full bg-white text-black rounded-xl py-3.5 font-semibold hover:scale-[1.02] transition-transform mt-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-[1px] bg-white/10" />
          <span className="text-xs text-[#86868b] uppercase tracking-wider font-medium">Or continue with</span>
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleSocialAuth} type="button" className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl py-3 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-sm font-medium text-white">Google</span>
          </button>
          <button onClick={handleSocialAuth} type="button" className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl py-3 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.76 1.56.04 2.87.68 3.64 1.8-3.24 1.83-2.73 6.22.42 7.42-.78 1.86-1.87 3.54-2.73 3.71zm-3.52-14.2c.59-1.43-.37-3.13-1.84-3.38-.68 1.51.46 3.1 1.84 3.38z" />
            </svg>
            <span className="text-sm font-medium text-white">Apple</span>
          </button>
        </div>

        <p className="mt-8 text-center text-[#86868b] text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-white hover:text-[#00FFFF] transition-colors font-medium"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
