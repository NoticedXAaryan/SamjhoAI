/**
 * useMeetingMedia — handles audio detection, speech-to-text, and hand tracking
 * for the meeting page. Runs entirely client-side.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ── Audio analyser: detects who is speaking via Web Audio API ─────────────────
const SPEAKING_THRESHOLD = 0.02;          // RMS volume threshold
const SPEAKING_COOLDOWN = 500;           // ms to keep "speaking" after silence

export function createSpeakingAnalyser(stream: MediaStream): {
  analyser: AnalyserNode;
  detectSpeaking: () => boolean;
  stop: () => void;
} {
  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.8;
  source.connect(analyser);

  const data = new Float32Array(analyser.fftSize);
  const detectSpeaking = (): boolean => {
    analyser.getFloatTimeDomainData(data);
    let rms = 0;
    for (let i = 0; i < data.length; i++) rms += data[i] * data[i];
    rms = Math.sqrt(rms / data.length);
    return rms > SPEAKING_THRESHOLD;
  };

  const stop = () => {
    source.disconnect();
    analyser.disconnect();
    context.close();
  };

  return { analyser, detectSpeaking, stop };
}

// ── Hand tracking via MediaPipe Hands ─────────────────────────────────────────
interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandResult {
  handsDetected: number;
  landmarks: HandLandmark[][];  // each hand = 21 landmarks
  gesture: string;
}

function distance3d(a: HandLandmark, b: HandLandmark): number {
  return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2 + (a.z-b.z)**2);
}

function isFingerStraight(landmarks: HandLandmark[], tipIdx: number, pipIdx: number, mcpIdx: number): boolean {
  // Check if finger is extended by comparing tip-to-wrist distance vs pip-to-wrist
  const wrist = landmarks[0];
  const tipToWrist = distance3d(landmarks[tipIdx], wrist);
  const pipToWrist = distance3d(landmarks[pipIdx], wrist);
  return tipToWrist > pipToWrist * 1.2;
}

function isFingerCurled(landmarks: HandLandmark[], tipIdx: number, pipIdx: number): boolean {
  return distance3d(landmarks[tipIdx], landmarks[0]) < distance3d(landmarks[pipIdx], landmarks[0]) * 1.1;
}

function classifyGesture(landmarks: HandLandmark[]): string {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const indexMCP = landmarks[5];
  const indexPIP = landmarks[6];
  const middleTip = landmarks[12];
  const middleMCP = landmarks[9];
  const middlePIP = landmarks[10];
  const ringTip = landmarks[16];
  const ringPIP = landmarks[14];
  const pinkyTip = landmarks[20];
  const pinkyPIP = landmarks[18];

  const indexExtended = isFingerStraight(landmarks, 8, 6, 5);
  const middleExtended = isFingerStraight(landmarks, 12, 10, 9);
  const ringExtended = isFingerStraight(landmarks, 16, 14, 13);
  const pinkyExtended = isFingerStraight(landmarks, 20, 18, 17);
  const thumbExtended = distance3d(thumbTip, landmarks[0]) > distance3d(landmarks[3], landmarks[0]) * 1.15;

  const indexCurled = isFingerCurled(landmarks, 8, 6);
  const middleCurled = isFingerCurled(landmarks, 12, 10);
  const ringCurled = isFingerCurled(landmarks, 16, 14);
  const pinkyCurled = isFingerCurled(landmarks, 20, 18);

  // === Open Palm === (all fingers extended)
  if (indexExtended && middleExtended && ringExtended && pinkyExtended && thumbExtended) {
    return 'Open Palm ✋';
  }

  // === Thumbs Up === (only thumb extended, others curled)
  if (thumbExtended && indexCurled && middleCurled && ringCurled && pinkyCurled) {
    return 'Thumbs Up 👍';
  }

  // === Peace / Victory === (index + middle extended, others curled)
  if (indexExtended && middleExtended && ringCurled && pinkyCurled) {
    return 'Peace Sign ✌️';
  }

  // === OK Sign === (ok circle: thumb tip near index tip, other fingers extended)
  const thumbToIndex = distance3d(thumbTip, indexTip);
  if (thumbToIndex < 0.08 && middleExtended && ringExtended && pinkyExtended) {
    return 'OK 👌';
  }

  // === I Love You ASL === (thumb + index + pinky extended, middle + ring curled)
  if (thumbExtended && indexExtended && pinkyExtended && middleCurled && ringCurled) {
    return 'I Love You 🤟';
  }

  // === Pointing Up === (only index extended)
  if (indexExtended && middleCurled && ringCurled && pinkyCurled && !thumbExtended) {
    return 'Pointing Up ☝️';
  }

  // === Fist === (all curled)
  if (!thumbExtended && indexCurled && middleCurled && ringCurled && pinkyCurled) {
    return 'Fist ✊';
  }

  // === Number signs ===
  // Three = index + middle + ring extended
  if (indexExtended && middleExtended && ringExtended && pinkyCurled && !thumbExtended) {
    return 'Three 🤙';
  }
  // Four = index + middle + ring + pinky
  if (!thumbExtended && indexExtended && middleExtended && ringExtended && pinkyExtended) {
    return 'Four 🖖';
  }
  // Spider-Man = thumb + index + pinky extended
  if (thumbExtended && indexExtended && pinkyExtended && middleCurled && ringCurled) {
    return 'I Love You 🤟';
  }
  // Rock On = index + pinky extended, thumb over middle+ring
  if (indexExtended && pinkyExtended && middleCurled && ringCurled && !thumbExtended) {
    return 'Rock On 🤘';
  }
  // Call Me = thumb + pinky extended
  if (thumbExtended && pinkyExtended && indexCurled && middleCurled && ringCurled) {
    return 'Call Me 🤙';
  }

  return '';
}

// ── Speech-to-Text via Web Speech API ─────────────────────────────────────────
export interface SpeechTranscript {
  text: string;
  isFinal: boolean;
  interim: string;
}

// ── Combined hook ─────────────────────────────────────────────────────────────
export function useMeetingMedia(isAiActive: boolean) {
  const [handResults, setHandResults] = useState<HandResult>({
    handsDetected: 0,
    landmarks: [],
    gesture: '',
  });
  const [speechTranscript, setSpeechTranscript] = useState<SpeechTranscript>({
    text: '',
    isFinal: true,
    interim: '',
  });
  const [speakingMap, setSpeakingMap] = useState<Map<string, boolean>>(new Map());

  const analysersRef = useRef<Map<string, { stop: () => void; detectSpeaking: () => boolean }>>(new Map());
  const mediaPipeRef = useRef<any>(null);
  const animationFrameRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ── Start hand tracking from local webcam ───────────────────────────────
  const startHandTracking = useCallback(async (video: HTMLVideoElement) => {
    videoRef.current = video;

    try {
      const visionMod = await import('@mediapipe/tasks-vision');
      const { HandLandmarker, FilesetResolver } = visionMod;

      const wasm = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm'
      );

      mediaPipeRef.current = await HandLandmarker.createFromOptions(wasm, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      const detectFrame = () => {
        if (!video.readyState || video.readyState < 2 || !mediaPipeRef.current) {
          animationFrameRef.current = requestAnimationFrame(detectFrame);
          return;
        }

        try {
          const result = mediaPipeRef.current.detectForVideo(video, performance.now());

          if (result.landmarks && result.landmarks.length > 0) {
            const landmarksByHand = result.landmarks.map((h: HandLandmark[]) => h);
            const gestures = result.landmarks.map((h: HandLandmark[]) => classifyGesture(h as HandLandmark[]));

            setHandResults({
              handsDetected: result.landmarks.length,
              landmarks: landmarksByHand,
              gesture: gestures.filter(Boolean).join(' + ') || '',
            });
          } else {
            setHandResults(prev => ({ ...prev, handsDetected: 0, gesture: '' }));
          }
        } catch {
          // Frame might not be ready
        }

        animationFrameRef.current = requestAnimationFrame(detectFrame);
      };

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    } catch (err) {
      console.warn('MediaPipe hand tracking init failed:', err);
    }
  }, []);

  const stopHandTracking = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (mediaPipeRef.current) {
      mediaPipeRef.current.close();
      mediaPipeRef.current = null;
    }
  }, []);

  // ── Speech-to-Text via Web Speech API ────────────────────────────────
  useEffect(() => {
    if (!isAiActive || !('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setSpeechTranscript({ text: finalTranscript.trim(), isFinal: true, interim: '' });
      }
      if (interimTranscript) {
        setSpeechTranscript(prev => ({ ...prev, interim: interimTranscript }));
      }
    };

    recognition.onerror = () => {};
    recognition.onend = () => {
      // Auto-restart for continuous recognition
      try { recognition.start(); } catch {}
    };

    try {
      recognition.start();
    } catch {}

    return () => {
      try { recognition.stop(); } catch {}
    };
  }, [isAiActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopHandTracking();
      analysersRef.current.forEach((a) => a.stop());
      analysersRef.current.clear();
    };
  }, [stopHandTracking]);

  // ── Update speaking detection for a remote stream ────────────────────
  const registerSpeakingAnalyser = useCallback((peerId: string, stream: MediaStream) => {
    // Remove existing analyser
    const existing = analysersRef.current.get(peerId);
    if (existing) existing.stop();

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0 || !audioTracks[0].enabled) {
      analysersRef.current.delete(peerId);
      setSpeakingMap(prev => { const m = new Map(prev); m.delete(peerId); return m; });
      return;
    }

    const { stop, detectSpeaking } = createSpeakingAnalyser(stream);
    let rafId = 0;

    // Store analyser so check() and unregister can find it
    const entry = {
      stop: () => {
        cancelAnimationFrame(rafId);
        stop();
      },
      detectSpeaking,
    };
    analysersRef.current.set(peerId, entry);

    // Poll for speaking state
    let lastSpeakingTime = 0;
    const check = () => {
      const analyser = analysersRef.current.get(peerId);
      if (!analyser) return;

      const isNowSpeaking = analyser.detectSpeaking();

      if (isNowSpeaking) {
        lastSpeakingTime = Date.now();
      }

      const isSpeaking = isNowSpeaking || (Date.now() - lastSpeakingTime) < SPEAKING_COOLDOWN;

      setSpeakingMap(prev => {
        const prevVal = prev.get(peerId);
        if (prevVal === isSpeaking) return prev;
        const m = new Map(prev);
        m.set(peerId, isSpeaking);
        return m;
      });

      rafId = requestAnimationFrame(check);
    };
    rafId = requestAnimationFrame(check);
  }, []);

  const unregisterSpeakingAnalyser = useCallback((peerId: string) => {
    const existing = analysersRef.current.get(peerId);
    if (existing) {
      existing.stop();
      analysersRef.current.delete(peerId);
    }
    setSpeakingMap(prev => { const m = new Map(prev); m.delete(peerId); return m; });
  }, []);

  return {
    handResults,
    startHandTracking,
    stopHandTracking,
    speechTranscript,
    speakingMap,
    registerSpeakingAnalyser,
    unregisterSpeakingAnalyser,
  };
}
