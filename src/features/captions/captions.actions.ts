'use server';

import { prisma } from '@/lib/prisma';
import { requireSession } from '@/features/auth/session';
import type { TranscriptSegment } from './captions.types';

export async function saveCaptionSegment(roomName: string, segment: TranscriptSegment) {
  await requireSession();

  const meeting = await prisma.meeting.findUnique({
    where: { roomName },
    select: { id: true },
  });
  if (!meeting) return;

  await prisma.transcript.create({
    data: {
      meetingId: meeting.id,
      content: JSON.stringify(segment),
    },
  });
}

export async function getTranscript(roomName: string): Promise<TranscriptSegment[]> {
  await requireSession();

  const meeting = await prisma.meeting.findUnique({
    where: { roomName },
    select: { id: true },
  });
  if (!meeting) return [];

  const rows = await prisma.transcript.findMany({
    where: { meetingId: meeting.id },
    orderBy: { createdAt: 'asc' },
    select: { content: true },
    take: 2000,
  });

  return rows
    .map((r) => {
      try {
        return JSON.parse(r.content) as TranscriptSegment;
      } catch {
        return null;
      }
    })
    .filter((x): x is TranscriptSegment => Boolean(x));
}

