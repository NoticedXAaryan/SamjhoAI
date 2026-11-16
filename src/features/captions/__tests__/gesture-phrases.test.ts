import { describe, expect, it } from 'vitest';
import { handSignVocabulary, phraseForGesture } from '../gesture-phrases';
import { toSpeechLocale } from '../speech-locales';

describe('phraseForGesture', () => {
  it('maps a confident MediaPipe gesture to a meeting phrase', () => {
    expect(phraseForGesture('Thumb_Up', 0.91)).toEqual({
      gestureType: 'thumbs_up',
      content: 'Yes',
      confidence: 0.91,
    });
  });

  it('ignores unknown, low-confidence, and empty results', () => {
    expect(phraseForGesture('None', 0.99)).toBeNull();
    expect(phraseForGesture('Thumb_Up', 0.4)).toBeNull();
    expect(phraseForGesture(undefined, 1)).toBeNull();
    expect(phraseForGesture('Wave', 0.9)).toBeNull();
  });

  it('lists the signs a participant can actually produce', () => {
    expect(handSignVocabulary()).toEqual([
      'Hello',
      'Please wait',
      'Look here',
      'Yes',
      'No',
      'Peace',
      'I love you',
    ]);
  });
});

describe('toSpeechLocale', () => {
  it('uses a real speech-recognition locale and falls back to English', () => {
    expect(toSpeechLocale('hi')).toBe('hi-IN');
    expect(toSpeechLocale('xx')).toBe('en-US');
  });
});
