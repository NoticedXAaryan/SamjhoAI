export const GESTURE_PHRASES = {
  Open_Palm: { gestureType: 'open_palm', content: 'Hello' },
  Closed_Fist: { gestureType: 'closed_fist', content: 'Please wait' },
  Pointing_Up: { gestureType: 'point', content: 'Look here' },
  Thumb_Up: { gestureType: 'thumbs_up', content: 'Yes' },
  Thumb_Down: { gestureType: 'thumbs_down', content: 'No' },
  Victory: { gestureType: 'victory', content: 'Peace' },
  ILoveYou: { gestureType: 'i_love_you', content: 'I love you' },
} as const;

export type RecognizedGesture = keyof typeof GESTURE_PHRASES;

const MIN_GESTURE_SCORE = 0.55;

export function phraseForGesture(categoryName: string | undefined, score: number) {
  if (!categoryName || categoryName === 'None' || categoryName === 'Unknown') return null;
  if (!Number.isFinite(score) || score < MIN_GESTURE_SCORE) return null;
  const phrase = GESTURE_PHRASES[categoryName as RecognizedGesture];
  if (!phrase) return null;
  return { ...phrase, confidence: Math.min(1, Math.max(0, score)) };
}

export function handSignVocabulary() {
  return Object.values(GESTURE_PHRASES).map((phrase) => phrase.content);
}
