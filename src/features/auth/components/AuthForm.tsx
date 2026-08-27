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
    <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-3xl border border-white/10 bg-black/60 p-8 shadow-2xl">
      <div>
        <h1 className="text-2xl font-semibold">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-2 text-sm text-white/60">Self-hosted authentication. Your account stays in your PostgreSQL database.</p>
      </div>
      {isSignUp && <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} /></div>}
      <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      {error && <p role="alert" className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">{pending ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}</Button>
      <p className="text-center text-sm text-white/60">
        {isSignUp ? 'Already have an account?' : 'Need an account?'}{' '}
        <Link className="text-cyan-300 hover:text-cyan-200" href={isSignUp ? '/sign-in' : '/sign-up'}>{isSignUp ? 'Sign in' : 'Sign up'}</Link>
      </p>
    </form>
  );
}
