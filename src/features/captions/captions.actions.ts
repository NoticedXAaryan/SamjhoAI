// src/features/captions/captions.actions.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { validate, RoomNameSchema, CaptionSegmentSchema } from '@/shared/lib/validation';
import { PrismaCaptionRepository } from './captions.repository';
import type { TranscriptSegment } from './captions.types';

const repo = new PrismaCaptionRepository();

export async function saveCaptionSegment(rawRoomName: string, rawSegment: TranscriptSegment) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const roomName = validate(RoomNameSchema, rawRoomName);
  const segment = validate(CaptionSegmentSchema, rawSegment);
  await repo.appendSegment(roomName, segment as TranscriptSegment);
}

export async function getTranscript(rawRoomName: string): Promise<TranscriptSegment[]> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const roomName = validate(RoomNameSchema, rawRoomName);
  return repo.findByRoomName(roomName);
}
