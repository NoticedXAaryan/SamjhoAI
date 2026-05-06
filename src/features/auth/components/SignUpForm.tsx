'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUp } from '@/features/auth/auth.client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signUp.email({ name, email, password });
      if (result.error) throw new Error(result.error.message ?? 'Could not create account.');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-up failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-white/60">Start using Samjho AI.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          type="password"
          placeholder="Min 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
          autoComplete="new-password"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-white/60">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-white underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}

