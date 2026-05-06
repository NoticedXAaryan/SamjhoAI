"use client";

import { useEffect, useState } from 'react';

export function useSpeechToText() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    interface SpeechRecognitionLike {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onstart: () => void;
      onend: () => void;
      onresult: (event: { resultIndex: number; results: Array<{ 0: { transcript: string } }> }) => void;
      onerror: (event: Event) => void;
      start: () => void;
      stop: () => void;
    }

    const windowWithSpeech = window as unknown as Record<string, unknown>;
    const SpeechRecognitionConstructor = (windowWithSpeech.SpeechRecognition ?? windowWithSpeech.webkitSpeechRecognition) as
      | { new (): SpeechRecognitionLike }
      | undefined;
    if (!SpeechRecognitionConstructor) {
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      let latestTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        latestTranscript += event.results[i][0].transcript;
      }
      setTranscript(latestTranscript.trim());
    };

    recognition.onerror = () => setIsListening(false);
    recognition.start();

    return () => {
      recognition.stop();
      setIsListening(false);
    };
  }, []);

  return { transcript, isListening };
}
