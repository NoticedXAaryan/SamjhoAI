'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { Track, type LocalVideoTrack } from 'livekit-client';
import { broadcastCaption } from '@/shared/lib/livekit';
import { saveCaptionSegment } from '@/features/captions/captions.actions';
import { phraseForGesture } from '@/features/captions/gesture-phrases';
import { toSpeechLocale } from '@/features/captions/speech-locales';
import type { GestureRecognizer } from '@mediapipe/tasks-vision';

const WASM_PATH = '/mediapipe';
const MODEL_PATH = '/mediapipe/gesture_recognizer.task';

interface Props {
  enabled: boolean;
  roomName: string;
  userId: string;
  userName: string;
  language: string;
}

export function GestureCaptions({ enabled, roomName, userId, userName, language }: Props) {
  const room = useRoomContext();
  const { localParticipant, isCameraEnabled } = useLocalParticipant();
  const cameraPublication = localParticipant
    ? localParticipant.getTrackPublication(Track.Source.Camera)
    : undefined;
  const publicationRef = useRef(cameraPublication);
  publicationRef.current = cameraPublication;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('');
  const [liveLabel, setLiveLabel] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled) return;
    const video = videoRef.current;
    const track = publicationRef.current?.track as LocalVideoTrack | undefined;
    if (!isCameraEnabled || !track || !video) {
      setLiveLabel('');
      setStatus('Turn your camera on to share hand signs.');
      return;
    }

    track.attach(video);
    let cancelled = false;
    let frame = 0;
    let recognizer: GestureRecognizer | null = null;
    let stableType = '';
    let stableCount = 0;
    let lastEmitted = '';
    let lastEmitAt = 0;
    let shownLabel = '';

    const publish = (gestureType: string, content: string, confidence: number) => {
      const timestamp = Date.now();
      const caption = {
        id: crypto.randomUUID(),
        userId,
        userName,
        type: 'gesture' as const,
        content,
        gestureType,
        language: toSpeechLocale(language),
        confidence,
        timestamp,
      };
      void broadcastCaption(room, caption);
      void saveCaptionSegment(roomName, {
        userId,
        userName,
        content,
        type: 'gesture',
        language: caption.language,
        confidence,
        timestamp,
        gestureType,
      }).catch(() => {
        setError('The hand sign was shared live, but it could not be saved to the transcript.');
      });
    };

    void (async () => {
      try {
        setError('');
        setStatus('Loading the hand-sign model…');
        const vision = await import('@mediapipe/tasks-vision');
        const fileset = await vision.FilesetResolver.forVisionTasks(WASM_PATH);
        const options = {
          baseOptions: { modelAssetPath: MODEL_PATH },
          runningMode: 'VIDEO' as const,
          numHands: 1,
        };
        try {
          recognizer = await vision.GestureRecognizer.createFromOptions(fileset, {
            ...options,
            baseOptions: { ...options.baseOptions, delegate: 'GPU' },
          });
        } catch {
          recognizer = await vision.GestureRecognizer.createFromOptions(fileset, {
            ...options,
            baseOptions: { ...options.baseOptions, delegate: 'CPU' },
          });
        }
        if (cancelled) {
          recognizer.close();
          recognizer = null;
          return;
        }
        setStatus('');

        const loop = () => {
          if (cancelled || !recognizer) return;
          if (video.readyState >= 2) {
            const result = recognizer.recognizeForVideo(video, performance.now());
            const top = result.gestures[0]?.[0];
            const phrase = phraseForGesture(top?.categoryName, top?.score ?? 0);
            if (!phrase) {
              stableType = '';
              stableCount = 0;
              if (shownLabel) {
                shownLabel = '';
                setLiveLabel('');
              }
            } else if (phrase.gestureType === stableType) {
              stableCount += 1;
              if (stableCount >= 6 && shownLabel !== phrase.content) {
                shownLabel = phrase.content;
                setLiveLabel(phrase.content);
              }
              const now = Date.now();
              const heldLongEnough = stableCount === 6 || (lastEmitted === phrase.gestureType && now - lastEmitAt > 4000);
              if (stableCount >= 6 && heldLongEnough && (lastEmitted !== phrase.gestureType || now - lastEmitAt > 4000)) {
                lastEmitted = phrase.gestureType;
                lastEmitAt = now;
                publish(phrase.gestureType, phrase.content, phrase.confidence);
              }
            } else {
              stableType = phrase.gestureType;
              stableCount = 1;
            }
          }
          frame = requestAnimationFrame(loop);
        };
        frame = requestAnimationFrame(loop);
      } catch (loadError) {
        if (!cancelled) {
          setStatus('');
          setError(loadError instanceof Error ? loadError.message : 'Hand-sign recognition could not start.');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      recognizer?.close();
      track.detach(video);
    };
  }, [cameraPublication?.trackSid, enabled, isCameraEnabled, language, room, roomName, userId, userName]);

  if (!enabled) return null;

  return (
    <>
      <video ref={videoRef} muted playsInline autoPlay className="pointer-events-none absolute h-px w-px opacity-0" />
      {(liveLabel || status || error) && (
        <div role="status" className="pointer-events-none absolute left-4 top-16 z-20 max-w-sm rounded-lg border border-cyan-300/40 bg-black/85 px-3 py-2 text-sm text-white shadow-xl">
          {error && <p className="text-amber-200">{error}</p>}
          {status && <p>{status}</p>}
          {liveLabel && <p>Hand sign: {liveLabel}</p>}
        </div>
      )}
    </>
  );
}
