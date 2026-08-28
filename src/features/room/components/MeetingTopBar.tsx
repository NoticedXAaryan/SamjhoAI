'use client';

import { useState } from 'react';
import { Check, Copy, MessageSquare, Settings, Users } from 'lucide-react';
import { useParticipants } from '@livekit/components-react';
import { BrandLogo } from '@/components/brand/BrandLogo';

interface Props {
  title: string;
  roomName: string;
  onToggleParticipants: () => void;
  onToggleChat: () => void;
  onSettingsOpen: () => void;
}

export function MeetingTopBar({ title, roomName, onToggleParticipants, onToggleChat, onSettingsOpen }: Props) {
  const participants = useParticipants();
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/meeting/${encodeURIComponent(roomName)}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between bg-[#202124] px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <BrandLogo compact className="h-8 w-8 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white/90">{title}</p>
          <p className="text-xs text-white/45">{participants.length} participant{participants.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      <button type="button" onClick={() => void copyLink()} className="hidden items-center gap-2 rounded-full px-3 py-2 text-xs text-white/65 transition hover:bg-white/10 hover:text-white sm:flex">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copied' : 'Copy meeting link'}
      </button>

      <div className="flex items-center gap-1 sm:hidden">
        <MobileAction label="Participants" onClick={onToggleParticipants}><Users /></MobileAction>
        <MobileAction label="Meeting chat" onClick={onToggleChat}><MessageSquare /></MobileAction>
        <MobileAction label="Meeting settings" onClick={onSettingsOpen}><Settings /></MobileAction>
      </div>
    </header>
  );
}

function MobileAction({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white [&_svg]:h-5 [&_svg]:w-5">
      {children}
    </button>
  );
}
