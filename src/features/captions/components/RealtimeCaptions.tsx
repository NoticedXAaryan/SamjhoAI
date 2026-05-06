'use client';

import { useState, useEffect } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent, type RemoteParticipant } from 'livekit-client';
import { parseCaptionPacket } from '@/shared/lib/livekit';
import { cn } from '@/lib/utils';
import type { CaptionPacket } from '../captions.types';

const sizeClass = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' } as const;

interface Props {
  enabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top' | 'bottom';
}

type LiveCaption = CaptionPacket & { expireAt: number };

export function RealtimeCaptions({ enabled = true, size = 'md', position = 'bottom' }: Props) {
  const room = useRoomContext();
  const [captions, setCaptions] = useState<LiveCaption[]>([]);

  useEffect(() => {
    if (!room) return;

    const onData = (payload: Uint8Array, _participant?: RemoteParticipant) => {
      if (!enabled) return;
      const caption = parseCaptionPacket(payload);
      if (!caption) return;
      setCaptions((prev) =>
        [{ ...caption, expireAt: Date.now() + 6_000 }, ...prev].slice(0, 5)
      );
    };

    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [enabled, room]);

  useEffect(() => {
    const t = setInterval(() => {
      setCaptions((prev) => prev.filter((c) => Date.now() < c.expireAt));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  if (!enabled || captions.length === 0) return null;

  return (
    <div
      className={cn(
        'absolute left-4 right-4 z-20 space-y-1.5 pointer-events-none',
        position === 'bottom' ? 'bottom-20' : 'top-16'
      )}
    >
      {captions.map((c) => (
        <div
          key={c.id}
          className="max-w-xl mx-auto rounded-lg bg-black/85 backdrop-blur-sm border border-white/10 px-4 py-2"
        >
          <p className="text-xs text-white/50 mb-0.5">{c.userName}</p>
          <p className={cn('text-white font-medium', sizeClass[size])}>{c.content}</p>
          {c.gestureType && (
            <p className="text-xs text-cyan-400 mt-0.5">🤟 {c.gestureType}</p>
          )}
        </div>
      ))}
    </div>
  );
}
