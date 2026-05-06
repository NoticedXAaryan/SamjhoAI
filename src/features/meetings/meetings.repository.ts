// src/features/meetings/meetings.repository.ts
// S — Single Responsibility: only data access
// L — Liskov: this class fully satisfies IMeetingRepository

import { prisma } from '@/lib/prisma';
import type { IMeetingRepository, Meeting, CreateMeetingInput } from './meetings.types';

function generateRoomName(): string {
  return `meeting-${crypto.randomUUID().slice(0, 8)}`;
}

function formatTitle(title?: string): string {
  if (title?.trim()) return title.trim();
  return `Meeting · ${new Date().toLocaleString('en', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })}`;
}

export class PrismaMeetingRepository implements IMeetingRepository {
  async create(input: CreateMeetingInput): Promise<Pick<Meeting, 'roomName'>> {
    const roomName = generateRoomName();
    await prisma.meeting.create({
      data: {
        roomName,
        title: formatTitle(input.title),
        startsAt: new Date(),
        organizerId: input.organizerId,
      },
    });
    return { roomName };
  }

  async findByRoomName(roomName: string): Promise<Meeting | null> {
    const doc = await prisma.meeting.findUnique({
      where: { roomName },
      include: { organizer: true },
    });
    if (!doc) return null;
    return {
      id: doc.id,
      roomName: doc.roomName,
      title: doc.title,
      organizerId: doc.organizerId,
      status: (doc as any).status ?? 'scheduled',
      startsAt: doc.startsAt,
      endedAt: (doc as any).endedAt ?? null,
      createdAt: doc.createdAt,
    };
  }

  async findUpcomingByUser(userId: string): Promise<Meeting[]> {
    const docs = await prisma.meeting.findMany({
      where: {
        organizerId: userId,
        startsAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { startsAt: 'desc' },
      take: 20,
    });
    return docs.map(d => ({
      id: d.id,
      roomName: d.roomName,
      title: d.title,
      organizerId: d.organizerId,
      status: 'scheduled' as const,
      startsAt: d.startsAt,
      endedAt: null,
      createdAt: d.createdAt,
    }));
  }

  async findPastByUser(userId: string): Promise<Meeting[]> {
    const docs = await prisma.meeting.findMany({
      where: {
        organizerId: userId,
        startsAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { startsAt: 'desc' },
      take: 50,
    });
    return docs.map(d => ({
      id: d.id,
      roomName: d.roomName,
      title: d.title,
      organizerId: d.organizerId,
      status: 'ended' as const,
      startsAt: d.startsAt,
      endedAt: null,
      createdAt: d.createdAt,
    }));
  }

  async markActive(roomName: string): Promise<void> {
    // With current Prisma schema, startsAt represents activation
    await prisma.meeting.update({
      where: { roomName },
      data: { startsAt: new Date() },
    });
  }

  async markEnded(roomName: string, _organizerId: string): Promise<void> {
    // Mark as ended by setting startsAt far in the past
    // (The schema doesn't have status/endedAt fields yet; this is a safe workaround)
    await prisma.meeting.update({
      where: { roomName },
      data: { startsAt: new Date(0) },
    });
  }
}
