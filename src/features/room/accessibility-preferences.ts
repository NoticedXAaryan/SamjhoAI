import type { AccessibilityPreferences } from '@/shared/lib/types';
import { isSpeechLanguage } from '@/features/captions/speech-locales';

export const ACCESSIBILITY_STORAGE_KEY = 'samjho.accessibility.v1';

export const defaultAccessibilityPreferences: AccessibilityPreferences = {
  captionsEnabled: false,
  captionsSize: 'md',
  captionsPosition: 'bottom',
  gestureDisplayEnabled: false,
  highContrast: false,
  preferredLanguage: 'en',
};

export function parseAccessibilityPreferences(raw: string | null): AccessibilityPreferences {
  if (!raw) return defaultAccessibilityPreferences;
  try {
    const parsed = JSON.parse(raw) as Partial<AccessibilityPreferences>;
    const size = parsed.captionsSize;
    const position = parsed.captionsPosition;
    return {
      captionsEnabled: parsed.captionsEnabled === true,
      captionsSize: size === 'sm' || size === 'lg' ? size : 'md',
      captionsPosition: position === 'top' ? 'top' : 'bottom',
      gestureDisplayEnabled: parsed.gestureDisplayEnabled === true,
      highContrast: parsed.highContrast === true,
      preferredLanguage: typeof parsed.preferredLanguage === 'string' && isSpeechLanguage(parsed.preferredLanguage)
        ? parsed.preferredLanguage
        : 'en',
    };
  } catch {
    return defaultAccessibilityPreferences;
  }
}
