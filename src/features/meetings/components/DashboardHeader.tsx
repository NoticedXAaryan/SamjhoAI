'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Sparkles } from 'lucide-react';
import { signOut, useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

export function DashboardHeader() {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white"><Sparkles className="h-5 w-5 text-cyan-400" />Samjho AI</Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-white/60 sm:block">{session?.user.name}</span>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Sign out"
            onClick={async () => {
              await signOut();
              router.push('/');
              router.refresh();
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
