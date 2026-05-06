'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent, type RemoteParticipant } from 'livekit-client';
import { parseCaptionPacket } from '@/shared/lib/livekit';
import { CaptionsOverlay, type CaptionEntry } from '@/components/CaptionsOverlay';

type LiveCaption = CaptionEntry & { expireAt: number };

export function RealtimeCaptions({ enabled = true }: { enabled?: boolean }) {
  const room = useRoomContext();
  const [captions, setCaptions] = useState<LiveCaption[]>([]);

  useEffect(() => {
    if (!room) return;

    const onData = (payload: Uint8Array, participant?: RemoteParticipant) => {
      if (!enabled) return;
      const parsed = parseCaptionPacket(payload);
      if (!parsed) return;
      // Ignore our own echo (local participant doesn’t come through here anyway, but safe)
      if (participant?.identity && participant.identity === parsed.userId) return;

      setCaptions((prev) => [
        ...prev,
        {
          id: parsed.id,
          type: 'speech',
          text: parsed.content,
          userId: parsed.userId,
          expireAt: Date.now() + 6_000,
        },
      ]);
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

  const overlayCaptions = useMemo<CaptionEntry[]>(
    () => captions.slice(-5).map(({ expireAt: _expireAt, ...c }) => c),
    [captions]
  );

  return <CaptionsOverlay captions={overlayCaptions} />;
}

