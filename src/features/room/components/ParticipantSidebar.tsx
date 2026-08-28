'use client';

import { useParticipants } from '@livekit/components-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MicOff, VideoOff } from 'lucide-react';

export function ParticipantSidebar({ onClose }: { onClose: () => void }) {
  const participants = useParticipants();

  return (
    <aside className="absolute inset-y-2 right-2 z-40 flex w-[min(360px,calc(100vw-16px))] shrink-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#292a2d] shadow-2xl lg:static lg:inset-auto lg:my-2 lg:mr-2">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <p className="text-sm font-medium text-white/80">
          Participants
          <span className="text-white/50 font-normal ml-1.5">({participants.length})</span>
        </p>
        <button type="button" className="text-xs text-white/50 hover:text-white transition-colors" onClick={onClose}>
          Close
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {participants.map((p) => (
            <div
              key={p.identity}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                {(p.name ?? p.identity).charAt(0).toUpperCase()}
              </div>
              <p className="text-sm truncate flex-1">{p.name ?? p.identity}</p>
              <div className="flex gap-1 text-white/40">
                {!p.isMicrophoneEnabled && <MicOff className="h-3.5 w-3.5" />}
                {!p.isCameraEnabled && <VideoOff className="h-3.5 w-3.5" />}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
