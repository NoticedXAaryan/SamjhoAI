import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { getGuestSessionSecret } from '@/config/env';

export const GUEST_COOKIE_NAME = 'samjho_guest';
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const MAX_GUEST_ROOMS = 8;

export interface GuestSession {
  guestId: string;
  displayName: string;
  roomName: string;
  expiresAt: number;
}

interface GuestJar {
  sessions: GuestSession[];
}

function getSigningSecret() {
  return getGuestSessionSecret();
}

function sign(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}

function verifiedPayload(value: string, secret: string) {
  const [payload, signature, extra] = value.split('.');
  if (!payload || !signature || extra) return null;
  const expected = sign(payload, secret);
  const suppliedBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(suppliedBytes, expectedBytes)) {
    return null;
  }
  return payload;
}

function decodeJson(value: string, secret: string): unknown | null {
  const payload = verifiedPayload(value, secret);
  if (!payload) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as unknown;
  } catch {
    return null;
  }
}

function asSession(value: unknown, now: number, expectedRoomName?: string): GuestSession | null {
  if (!value || typeof value !== 'object') return null;
  const session = value as Partial<GuestSession>;
  if (
    typeof session.guestId !== 'string' ||
    typeof session.displayName !== 'string' ||
    typeof session.roomName !== 'string' ||
    typeof session.expiresAt !== 'number' ||
    session.expiresAt <= now ||
    (expectedRoomName !== undefined && session.roomName !== expectedRoomName)
  ) {
    return null;
  }
  return {
    guestId: session.guestId,
    displayName: session.displayName,
    roomName: session.roomName,
    expiresAt: session.expiresAt,
  };
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
  return asSession(decodeJson(value, secret), now, expectedRoomName);
}

/** A signed multi-room cookie, or null when the value is not a jar. */
export function decodeGuestJar(
  value: string,
  now = Date.now(),
  secret = getSigningSecret(),
): GuestSession[] | null {
  const parsed = decodeJson(value, secret);
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as GuestJar).sessions)) return null;
  return (parsed as GuestJar).sessions
    .map((session) => asSession(session, now))
    .filter((session): session is GuestSession => session !== null);
}

export function upsertGuestSession({
  existingValue,
  roomName,
  displayName,
  now = Date.now(),
  secret = getSigningSecret(),
}: {
  existingValue?: string;
  roomName: string;
  displayName: string;
  now?: number;
  secret?: string;
}) {
  const jar = existingValue ? decodeGuestJar(existingValue, now, secret) : null;
  const legacy = jar === null && existingValue ? asSession(decodeJson(existingValue, secret), now) : null;
  const current = jar ?? (legacy ? [legacy] : []);
  const previous = current.find((session) => session.roomName === roomName);
  const session: GuestSession = {
    guestId: previous?.guestId ?? `guest_${randomUUID()}`,
    displayName,
    roomName,
    expiresAt: now + SESSION_TTL_SECONDS * 1000,
  };
  const sessions = [session, ...current.filter((item) => item.roomName !== roomName)].slice(0, MAX_GUEST_ROOMS);
  const payload = Buffer.from(JSON.stringify({ sessions }), 'utf8').toString('base64url');

  return {
    session,
    cookie: {
      name: GUEST_COOKIE_NAME,
      value: `${payload}.${sign(payload, secret)}`,
      options: cookieOptions(),
    },
  };
}

export function createGuestSession(roomName: string, displayName: string, now = Date.now()) {
  return upsertGuestSession({ roomName, displayName, now });
}

export async function getGuestSession(roomName: string) {
  const value = (await cookies()).get(GUEST_COOKIE_NAME)?.value;
  if (!value) return null;
  const jar = decodeGuestJar(value);
  if (jar) return jar.find((session) => session.roomName === roomName) ?? null;
  return decodeGuestSession(value, roomName);
}
