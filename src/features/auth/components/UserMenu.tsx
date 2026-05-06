'use client';

import { signOut, useSession } from '@/features/auth/auth.client';
import { Button } from '@/components/ui/button';

export function UserMenu() {
  const { data: session } = useSession();
  const name = session?.user?.name ?? session?.user?.email ?? 'User';

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:block text-sm text-white/60 max-w-[14rem] truncate">{name}</div>
      <Button
        variant="secondary"
        onClick={() => {
          void signOut();
        }}
      >
        Sign out
      </Button>
    </div>
  );
}

