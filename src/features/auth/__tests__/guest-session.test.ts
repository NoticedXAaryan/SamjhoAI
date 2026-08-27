import { describe, expect, it } from 'vitest';
import { decodeGuestSession, encodeGuestSession, type GuestSession } from '../guest-session';

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
