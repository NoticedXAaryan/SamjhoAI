'use client';

import { useEffect, useRef, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { broadcastCaption } from '@/shared/lib/livekit';
import { saveCaptionSegment } from '@/features/captions/captions.actions';
import { toSpeechLocale } from '@/features/captions/speech-locales';
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

export function useSpeechToText(
  roomName: string,
  userId: string,
  userName: string,
  language: string,
  enabled: boolean,
) {
  const room = useRoomContext();
  const recognitionRef = useRef<InstanceType<SpeechRecognitionConstructor> | null>(null);
  const [error, setError] = useState('');
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    if (!enabled) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setError('');
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Live speech captions are not supported by this browser. Chrome and Edge support them.');
      return;
    }

    const locale = toSpeechLocale(language);
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = locale;
    setError('');

    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
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
          language: locale,
          confidence: event.results[i][0].confidence ?? 1,
          timestamp: Date.now(),
        };

        void broadcastCaption(room, caption);
        void saveCaptionSegment(roomName, {
          userId,
          userName,
          content: text,
          type: 'speech',
          language: locale,
          confidence: caption.confidence,
          timestamp: caption.timestamp,
        }).catch(() => {
          setStorageError('Live captions are still showing, but this line could not be saved to the transcript.');
        });
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'aborted' || event.error === 'no-speech') return;
      setError(
        event.error === 'not-allowed'
          ? 'Speech recognition permission is blocked.'
          : 'Speech recognition stopped unexpectedly.',
      );
    };

    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      try {
        recognition.start();
      } catch {
        setError('Speech recognition stopped. Turn captions off and on to try again.');
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      setError('Speech recognition could not start.');
    }

    return () => {
      recognition.onend = null;
      recognition.stop();
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };
  }, [enabled, language, room, roomName, userId, userName]);

  return {
    error,
    storageError,
    clearStorageError: () => setStorageError(''),
  };
}
