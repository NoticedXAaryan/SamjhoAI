'use client';

import { useRouter } from 'next/navigation';
import { Copy, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { Meeting } from '../meetings.types';

interface Props {
  meeting: Meeting;
}

export function MeetingCard({ meeting }: Props) {
  const router = useRouter();
  const date = new Date(meeting.startsAt);

  function copyLink() {
    const url = `${window.location.origin}/meeting/${meeting.roomName}`;
    void navigator.clipboard.writeText(url);
    toast.success('Meeting link copied');
  }

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl border border-white/5 bg-black/40 p-5 transition-all hover:bg-white/[0.04] hover:border-white/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-white/50">
            {date.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
            {' · '}
            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="mt-1.5 font-semibold text-white/90 truncate">{meeting.title}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
          <Video className="h-5 w-5" />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          onClick={() => router.push(`/meeting/${meeting.roomName}`)}
          size="sm"
          className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white"
        >
          Join
        </Button>
        <Button variant="secondary" size="sm" onClick={copyLink} title="Copy link">
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
