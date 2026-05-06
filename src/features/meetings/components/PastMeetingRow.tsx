'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';
import type { Meeting } from '../meetings.types';

interface Props {
  meeting: Meeting;
}

export function PastMeetingRow({ meeting }: Props) {
  const date = new Date(meeting.startsAt);

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-black/30 px-4 py-3 transition-colors hover:bg-white/[0.03]">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white/80 truncate">{meeting.title}</p>
        <p className="text-xs text-white/40 mt-0.5">
          {date.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>
      <Link
        href={`/meeting/${meeting.roomName}/summary`}
        className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors shrink-0"
      >
        <FileText className="h-3.5 w-3.5" />
        Transcript
      </Link>
    </div>
  );
}
