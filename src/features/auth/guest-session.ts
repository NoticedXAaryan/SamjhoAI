import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { getGuestSessionSecret } from '@/config/env';

const COOKIE_NAME = 'samjho_guest';
const SESSION_TTL_SECONDS = 12 * 60 * 60;

export interface GuestSession {
  guestId: string;
  displayName: string;
  roomName: string;
  expiresAt: number;
}

function getSigningSecret() {
  return getGuestSessionSecret();
}

function sign(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function encodeGuestSession(
  session: GuestSession,
  secret = getSigningSecret(),
) {
  const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export function decodeGuestSession(
  value: string,
  expectedRoomName: string,
  now = Date.now(),
  secret = getSigningSecret(),
): GuestSession | null {
  const [payload, signature, extra] = value.split('.');
  if (!payload || !signature || extra) return null;

  const expected = sign(payload, secret);
  const suppliedBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(suppliedBytes, expectedBytes)) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as GuestSession;
    if (
      typeof session.guestId !== 'string' ||
      typeof session.displayName !== 'string' ||
      session.roomName !== expectedRoomName ||
      typeof session.expiresAt !== 'number' ||
      session.expiresAt <= now
    ) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function createGuestSession(roomName: string, displayName: string, now = Date.now()) {
  const session: GuestSession = {
    guestId: `guest_${randomUUID()}`,
    displayName,
    roomName,
    expiresAt: now + SESSION_TTL_SECONDS * 1000,
  };

  return {
    session,
    cookie: {
      name: COOKIE_NAME,
      value: encodeGuestSession(session),
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: SESSION_TTL_SECONDS,
      },
    },
  };
}

export async function getGuestSession(roomName: string) {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  return value ? decodeGuestSession(value, roomName) : null;
}
