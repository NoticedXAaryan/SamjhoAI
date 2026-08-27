'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { signOut, useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand/BrandLogo';

export function DashboardHeader() {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Samjho AI home" className="flex items-center text-white">
          <BrandLogo priority className="h-10 w-auto" />
        </Link>
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
