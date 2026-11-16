import { describe, expect, it } from 'vitest';
import { parseAccessibilityPreferences } from '../accessibility-preferences';

describe('parseAccessibilityPreferences', () => {
  it('returns defaults for empty or corrupt storage', () => {
    expect(parseAccessibilityPreferences(null).preferredLanguage).toBe('en');
    expect(parseAccessibilityPreferences('{').captionsEnabled).toBe(false);
  });

  it('keeps only supported preference values', () => {
    expect(parseAccessibilityPreferences(JSON.stringify({
      captionsEnabled: true,
      captionsSize: 'lg',
      captionsPosition: 'top',
      gestureDisplayEnabled: true,
      highContrast: true,
      preferredLanguage: 'fr',
    }))).toMatchObject({
      captionsEnabled: true,
      captionsSize: 'lg',
      captionsPosition: 'top',
      gestureDisplayEnabled: true,
      highContrast: true,
      preferredLanguage: 'fr',
    });
    expect(parseAccessibilityPreferences(JSON.stringify({
      captionsSize: 'huge',
      preferredLanguage: 'zh',
    })).preferredLanguage).toBe('en');
  });
});
