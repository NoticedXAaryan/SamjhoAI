// src/shared/lib/types.ts
// Shared types used across multiple features
// Types that are needed by more than one feature module live here
// to prevent cross-feature imports (SOLID: Interface Segregation)

export interface AccessibilityPreferences {
  captionsEnabled: boolean;
  captionsSize: 'sm' | 'md' | 'lg';
  captionsPosition: 'top' | 'bottom';
  gestureDisplayEnabled: boolean;
  highContrast: boolean;
  preferredLanguage: string;
}
