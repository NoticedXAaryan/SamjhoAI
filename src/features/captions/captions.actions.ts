// src/features/captions/captions.actions.ts
'use server';

import { getSession } from '@/lib/auth';
import { validate, RoomNameSchema, CaptionSegmentSchema } from '@/shared/lib/validation';
import { PrismaCaptionRepository } from './captions.repository';
import type { TranscriptSegment } from './captions.types';
import { prisma } from '@/lib/prisma';
import { getGuestSession } from '@/features/auth/guest-session';

const repo = new PrismaCaptionRepository();

export async function saveCaptionSegment(rawRoomName: string, rawSegment: TranscriptSegment) {
  const session = await getSession();
  const roomName = validate(RoomNameSchema, rawRoomName);
  const guest = session?.user ? null : await getGuestSession(roomName);
  const participant = session?.user
    ? { id: session.user.id, name: session.user.name }
    : guest
      ? { id: guest.guestId, name: guest.displayName }
      : null;
  if (!participant) throw new Error('Unauthorized');

  const meeting = await prisma.meeting.findUnique({ where: { roomName }, select: { status: true } });
  if (!meeting || meeting.status === 'ended') throw new Error('Meeting is not active.');
  const segment = validate(CaptionSegmentSchema, {
    ...rawSegment,
    userId: participant.id,
    userName: participant.name,
  });
  await repo.appendSegment(roomName, segment as TranscriptSegment);
}

export async function getTranscript(rawRoomName: string): Promise<TranscriptSegment[]> {
  const session = await getSession();
  if (!session?.user.id) throw new Error('Unauthorized');

  const roomName = validate(RoomNameSchema, rawRoomName);
  const meeting = await prisma.meeting.findUnique({
    where: { roomName },
    select: { organizerId: true },
  });
  if (!meeting || meeting.organizerId !== session.user.id) throw new Error('Transcript access denied.');
  return repo.findByRoomName(roomName);
}
