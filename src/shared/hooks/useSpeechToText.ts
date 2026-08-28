'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { broadcastCaption } from '@/shared/lib/livekit';
import { saveCaptionSegment } from '@/features/captions/captions.actions';
import type { CaptionPacket } from '@/features/captions/captions.types';

interface SpeechRecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string; confidence?: number };
  }>;
}

type SpeechRecognitionConstructor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useSpeechToText(roomName: string, userId: string, userName: string) {
  const room = useRoomContext();
  const recognitionRef = useRef<InstanceType<SpeechRecognitionConstructor> | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setEnabled(false);
  }, []);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Live speech captions are not supported by this browser.');
      return;
    }

    setError('');

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = async (event: SpeechRecognitionResultEvent) => {
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
          language: 'en-US',
          confidence: event.results[i][0].confidence ?? 1,
          timestamp: Date.now(),
        };

        await broadcastCaption(room, caption);

        // Persist asynchronously; don't block UI on DB.
        void saveCaptionSegment(roomName, {
          userId,
          userName,
          content: text,
          type: 'speech',
          language: 'en-US',
          confidence: caption.confidence,
          timestamp: caption.timestamp,
        }).catch(() => {
          // Realtime captions should continue even if transcript storage is temporarily unavailable.
        });
      }
    };

    recognition.onerror = (event) => {
      setError(
        event.error === 'not-allowed'
          ? 'Speech recognition permission is blocked.'
          : 'Speech recognition stopped unexpectedly.',
      );
      stop();
    };
    recognition.onend = () => setEnabled(false);

    recognition.start();
    recognitionRef.current = recognition;
    setEnabled(true);
  }, [room, roomName, stop, userId, userName]);

  useEffect(() => () => stop(), [stop]);

  return { start, stop, enabled, error };
}
