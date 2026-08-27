'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn, signUp } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCallback = searchParams.get('callbackURL');
  const callbackURL = requestedCallback?.startsWith('/') && !requestedCallback.startsWith('//')
    ? requestedCallback
    : '/dashboard';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const isSignUp = mode === 'sign-up';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setPending(true);
    try {
      const result = isSignUp
        ? await signUp.email({ name: name.trim(), email: email.trim(), password, callbackURL })
        : await signIn.email({ email: email.trim(), password, callbackURL });
      if (result.error) {
        setError(result.error.message || 'Authentication failed.');
        return;
      }
      router.push(callbackURL);
      router.refresh();
    } catch {
      setError('Authentication failed. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">{isSignUp ? 'Get started' : 'Welcome back'}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{isSignUp ? 'Create your account' : 'Sign in to Samjho'}</h1>
        <p className="mt-3 text-sm leading-6 text-white/50">{isSignUp ? 'Create your secure account to host accessible meetings.' : 'Continue to your meetings, captions, and saved summaries.'}</p>
      </div>
      {isSignUp && <div className="space-y-2"><Label htmlFor="name" className="text-sm text-white/70">Name</Label><Input className="h-12 rounded-xl border-white/10 bg-white/[0.055] px-4 focus-visible:border-cyan-300/50 focus-visible:ring-cyan-300/20" id="name" placeholder="Your name" autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} /></div>}
      <div className="space-y-2"><Label htmlFor="email" className="text-sm text-white/70">Email</Label><Input className="h-12 rounded-xl border-white/10 bg-white/[0.055] px-4 focus-visible:border-cyan-300/50 focus-visible:ring-cyan-300/20" id="email" type="email" placeholder="you@example.com" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="password" className="text-sm text-white/70">Password</Label><Input className="h-12 rounded-xl border-white/10 bg-white/[0.055] px-4 focus-visible:border-cyan-300/50 focus-visible:ring-cyan-300/20" id="password" type="password" placeholder="At least 10 characters" autoComplete={isSignUp ? 'new-password' : 'current-password'} required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      {error && <p role="alert" className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>}
      <Button type="submit" disabled={pending} className="h-12 w-full rounded-xl bg-white font-semibold text-black hover:bg-white/90">{pending ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}</Button>
      <p className="text-center text-sm text-white/60">
        {isSignUp ? 'Already have an account?' : 'Need an account?'}{' '}
        <Link className="font-medium text-cyan-300 hover:text-cyan-200" href={isSignUp ? '/sign-in' : '/sign-up'}>{isSignUp ? 'Sign in' : 'Sign up'}</Link>
      </p>
    </form>
  );
}
