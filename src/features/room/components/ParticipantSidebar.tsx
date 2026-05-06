'use client';

import { useParticipants } from '@livekit/components-react';

export function ParticipantSidebar({ onClose }: { onClose: () => void }) {
  const participants = useParticipants();

  return (
    <aside className="w-72 border-l border-white/10 bg-black/50 backdrop-blur-xl flex flex-col shrink-0">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <p className="text-sm font-medium text-white/80">Participants</p>
        <button className="text-xs text-white/50 hover:text-white" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {participants.map((p) => (
          <div
            key={p.identity}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold">
              {(p.name ?? p.identity).slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate">{p.name ?? p.identity}</p>
              <p className="text-xs text-white/50 truncate">{p.identity}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

