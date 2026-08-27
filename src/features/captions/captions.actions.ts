// src/features/captions/captions.actions.ts
'use server';

import { getSession } from '@/lib/auth';
import { validate, RoomNameSchema, CaptionSegmentSchema } from '@/shared/lib/validation';
import { PrismaCaptionRepository } from './captions.repository';
import type { TranscriptSegment } from './captions.types';
import { prisma } from '@/lib/prisma';

const repo = new PrismaCaptionRepository();

export async function saveCaptionSegment(rawRoomName: string, rawSegment: TranscriptSegment) {
  const session = await getSession();
  if (!session?.user.id) throw new Error('Unauthorized');

  const roomName = validate(RoomNameSchema, rawRoomName);
  const meeting = await prisma.meeting.findUnique({ where: { roomName }, select: { status: true } });
  if (!meeting || meeting.status === 'ended') throw new Error('Meeting is not active.');
  const segment = validate(CaptionSegmentSchema, {
    ...rawSegment,
    userId: session.user.id,
    userName: session.user.name,
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
