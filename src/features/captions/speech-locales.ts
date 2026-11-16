export const SPEECH_LANGUAGES = [
  { code: 'en', label: 'English', locale: 'en-US' },
  { code: 'es', label: 'Spanish', locale: 'es-ES' },
  { code: 'fr', label: 'French', locale: 'fr-FR' },
  { code: 'de', label: 'German', locale: 'de-DE' },
  { code: 'hi', label: 'Hindi', locale: 'hi-IN' },
  { code: 'ja', label: 'Japanese', locale: 'ja-JP' },
] as const;

export type SpeechLanguageCode = (typeof SPEECH_LANGUAGES)[number]['code'];

export function isSpeechLanguage(code: string): code is SpeechLanguageCode {
  return SPEECH_LANGUAGES.some((language) => language.code === code);
}

export function toSpeechLocale(code: string) {
  return SPEECH_LANGUAGES.find((language) => language.code === code)?.locale ?? 'en-US';
}
