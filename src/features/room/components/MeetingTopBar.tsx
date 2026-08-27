'use client';

import { useParticipants } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand/BrandLogo';

export function MeetingTopBar({ title, onToggleSidebar, onToggleChat }: { title: string; onToggleSidebar: () => void; onToggleChat: () => void }) {
  const participants = useParticipants();

  return (
    <div className="h-14 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between px-4">
      <div className="flex min-w-0 items-center gap-3">
        <BrandLogo compact className="h-8 w-8" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="text-xs text-white/50">{participants.length} participant{participants.length === 1 ? '' : 's'}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onToggleChat}>Chat</Button>
        <Button variant="secondary" size="sm" onClick={onToggleSidebar}>Participants</Button>
      </div>
    </div>
  );
}

