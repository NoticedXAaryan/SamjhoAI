'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { broadcastCaption } from '@/shared/lib/livekit';
import { saveCaptionSegment } from '@/features/captions/captions.actions';
import type { CaptionPacket } from '@/features/captions/captions.types';

type SpeechRecognitionConstructor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  start: () => void;
  stop: () => void;
};

export function useSpeechToText(roomName: string, userId: string, userName: string) {
  const room = useRoomContext();
  const recognitionRef = useRef<InstanceType<SpeechRecognitionConstructor> | null>(null);
  const [enabled, setEnabled] = useState(false);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setEnabled(false);
  }, []);

  const start = useCallback(() => {
    const w = window as any;
    const SR = (w.SpeechRecognition || w.webkitSpeechRecognition) as SpeechRecognitionConstructor | undefined;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = async (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) continue;
        const text = event.results[i][0].transcript.trim();
        if (!text) continue;

        const caption: CaptionPacket = {
          id: crypto.randomUUID(),
          userId,
          userName,
          type: 'speech',
          content: text,
          timestamp: Date.now(),
        };

        await broadcastCaption(room, caption);

        // Persist asynchronously; don’t block UI on DB.
        void saveCaptionSegment(roomName, {
          userId,
          userName,
          content: text,
          timestamp: caption.timestamp,
        });
      }
    };

    recognition.onerror = () => {
      // Don’t throw; just stop.
      stop();
    };

    recognition.start();
    recognitionRef.current = recognition;
    setEnabled(true);
  }, [room, roomName, stop, userId, userName]);

  useEffect(() => () => stop(), [stop]);

  return { start, stop, enabled };
}

