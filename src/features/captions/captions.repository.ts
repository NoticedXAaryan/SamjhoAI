// src/features/captions/captions.repository.ts
// S — Single Responsibility: only transcript data access

import { prisma } from '@/lib/prisma';
import type { ICaptionRepository, TranscriptSegment } from './captions.types';

export class PrismaCaptionRepository implements ICaptionRepository {
  async appendSegment(roomName: string, segment: TranscriptSegment): Promise<void> {
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

  async findByRoomName(roomName: string): Promise<TranscriptSegment[]> {
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
}
