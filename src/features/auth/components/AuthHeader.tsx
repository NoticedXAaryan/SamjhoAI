'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from '@/lib/auth-client';

export function AuthHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/meeting') || pathname.startsWith('/sign-')) {
    return null;
  }

  return (
    <header className="fixed right-4 top-4 z-[70] flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-2 text-sm text-white shadow-xl backdrop-blur-xl">
      {!isPending && !session && (
        <>
          <Link href="/sign-in" className="rounded-full px-3 py-1 text-white/70 transition-colors hover:text-white">Sign in</Link>
          <Link href="/sign-up" className="rounded-full bg-white px-3 py-1 font-medium text-black transition-colors hover:bg-white/90">Sign up</Link>
        </>
      )}
      {!isPending && session && (
        <button
          type="button"
          className="rounded-full px-3 py-1 text-white/80 transition-colors hover:text-white"
          onClick={async () => {
            await signOut();
            router.push('/');
            router.refresh();
          }}
        >
          Sign out
        </button>
      )}
    </header>
  );
}
