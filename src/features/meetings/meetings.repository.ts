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
        status: 'scheduled',
        organizerId: input.organizerId,
      },
    });
    return { roomName };
  }

  async findByRoomName(roomName: string): Promise<Meeting | null> {
    const doc = await prisma.meeting.findUnique({
      where: { roomName },
    });
    if (!doc) return null;
    return {
      id: doc.id,
      roomName: doc.roomName,
      title: doc.title,
      organizerId: doc.organizerId,
      status: (doc.status as Meeting['status']) ?? 'scheduled',
      startsAt: doc.startsAt,
      endedAt: doc.endedAt ?? null,
      createdAt: doc.createdAt,
    };
  }

  async findUpcomingByUser(userId: string): Promise<Meeting[]> {
    const docs = await prisma.meeting.findMany({
      where: {
        organizerId: userId,
        status: { not: 'ended' },
      },
      orderBy: { startsAt: 'desc' },
      take: 20,
    });
    return docs.map(d => ({
      id: d.id,
      roomName: d.roomName,
      title: d.title,
      organizerId: d.organizerId,
      status: (d.status as Meeting['status']) ?? 'scheduled',
      startsAt: d.startsAt,
      endedAt: d.endedAt ?? null,
      createdAt: d.createdAt,
    }));
  }

  async findPastByUser(userId: string): Promise<Meeting[]> {
    const docs = await prisma.meeting.findMany({
      where: {
        organizerId: userId,
        status: 'ended',
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
      endedAt: d.endedAt ?? null,
      createdAt: d.createdAt,
    }));
  }

  async markActive(roomName: string): Promise<void> {
    await prisma.meeting.update({
      where: { roomName },
      data: { status: 'active', startsAt: new Date() },
    });
  }

  async markEnded(roomName: string, _organizerId: string): Promise<void> {
    await prisma.meeting.update({
      where: { roomName },
      data: { status: 'ended', endedAt: new Date() },
    });
  }
}
