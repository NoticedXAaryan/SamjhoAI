// src/features/captions/captions.actions.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { PrismaCaptionRepository } from './captions.repository';
import type { TranscriptSegment } from './captions.types';

const repo = new PrismaCaptionRepository();

export async function saveCaptionSegment(roomName: string, segment: TranscriptSegment) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  await repo.appendSegment(roomName, segment);
}

export async function getTranscript(roomName: string): Promise<TranscriptSegment[]> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  return repo.findByRoomName(roomName);
}
