'use client';

import { useParticipants } from '@livekit/components-react';
import { Button } from '@/components/ui/button';

export function MeetingTopBar({ title, onToggleSidebar, onToggleChat }: { title: string; onToggleSidebar: () => void; onToggleChat: () => void }) {
  const participants = useParticipants();

  return (
    <div className="h-14 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between px-4">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-white/50">{participants.length} participant{participants.length === 1 ? '' : 's'}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onToggleChat}>Chat</Button>
        <Button variant="secondary" size="sm" onClick={onToggleSidebar}>Participants</Button>
      </div>
    </div>
  );
}

