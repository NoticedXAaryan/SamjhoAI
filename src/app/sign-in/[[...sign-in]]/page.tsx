import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { SignInForm } from '@/features/auth/components/SignInForm';

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-[#050507] to-slate-900 text-white flex flex-col items-center justify-center p-6">
      <Link href="/" className="mb-8 flex items-center gap-2 text-sm text-white/70 hover:text-white">
        <Sparkles className="h-4 w-4 text-cyan-glow" />
        Samjho AI
      </Link>
      <SignInForm />
    </main>
  );
}

