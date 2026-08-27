import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { AuthForm } from '@/features/auth/components/AuthForm';

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-[#050507] to-slate-900 p-6 text-white">
      <Link href="/" className="mb-8 flex items-center gap-2 text-sm text-white/70 hover:text-white"><Sparkles className="h-4 w-4 text-cyan-400" />Samjho AI</Link>
      <AuthForm mode="sign-in" />
    </main>
  );
}
