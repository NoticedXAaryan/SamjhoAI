import { describe, expect, it } from 'vitest';
import { decodeGuestJar, decodeGuestSession, encodeGuestSession, upsertGuestSession, type GuestSession } from '../guest-session';

const secret = 'test-secret-that-is-longer-than-thirty-two-characters';
const now = Date.UTC(2026, 7, 27);

const session: GuestSession = {
  guestId: 'guest_123',
  displayName: 'Guest User',
  roomName: 'meeting-abc12345',
  expiresAt: now + 60_000,
};

describe('guest session signing', () => {
  it('round-trips a valid room-scoped session', () => {
    const value = encodeGuestSession(session, secret);
    expect(decodeGuestSession(value, session.roomName, now, secret)).toEqual(session);
  });

  it('rejects tampered, expired, and wrong-room sessions', () => {
    const value = encodeGuestSession(session, secret);
    expect(decodeGuestSession(`${value}x`, session.roomName, now, secret)).toBeNull();
    expect(decodeGuestSession(value, 'meeting-other', now, secret)).toBeNull();
    expect(decodeGuestSession(value, session.roomName, session.expiresAt, secret)).toBeNull();
  });
});

describe('guest session jar', () => {
  it('keeps a separate credential for each room in one cookie', () => {
    const first = upsertGuestSession({
      roomName: 'meeting-abc12345',
      displayName: 'Asha',
      now,
      secret,
    });
    const second = upsertGuestSession({
      existingValue: first.cookie.value,
      roomName: 'meeting-def67890',
      displayName: 'Asha',
      now,
      secret,
    });

    const sessions = decodeGuestJar(second.cookie.value, now, secret);
    expect(sessions?.map((item) => item.roomName).sort()).toEqual([
      'meeting-abc12345',
      'meeting-def67890',
    ]);
    expect(sessions?.find((item) => item.roomName === 'meeting-abc12345')?.guestId).toBe(first.session.guestId);
  });

  it('keeps the same guest id when the display name in a room changes', () => {
    const first = upsertGuestSession({
      roomName: session.roomName,
      displayName: 'Asha',
      now,
      secret,
    });
    const renamed = upsertGuestSession({
      existingValue: first.cookie.value,
      roomName: session.roomName,
      displayName: 'Asha K',
      now,
      secret,
    });
    expect(renamed.session.guestId).toBe(first.session.guestId);
    expect(renamed.session.displayName).toBe('Asha K');
  });
});
