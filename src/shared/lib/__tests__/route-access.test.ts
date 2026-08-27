import { describe, expect, it } from 'vitest';
import { isProtectedPath } from '../route-access';

describe('route access policy', () => {
  it('keeps account and host-only pages protected', () => {
    expect(isProtectedPath('/dashboard')).toBe(true);
    expect(isProtectedPath('/dashboard/settings')).toBe(true);
    expect(isProtectedPath('/meeting')).toBe(true);
    expect(isProtectedPath('/meeting/meeting-123/summary')).toBe(true);
  });

  it('allows direct meeting links for guests', () => {
    expect(isProtectedPath('/meeting/meeting-123')).toBe(false);
    expect(isProtectedPath('/meeting/meeting-123/')).toBe(false);
  });

  it('does not protect unrelated prefix lookalikes', () => {
    expect(isProtectedPath('/dashboarding')).toBe(false);
    expect(isProtectedPath('/meetings')).toBe(false);
  });
});
