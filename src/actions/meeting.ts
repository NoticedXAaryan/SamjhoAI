'use server';

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/features/auth/session';

export type CreateMeetingDTO = {
  title: string;
  startsAt: string;
};

async function getOrCreateCurrentUser() {
  const session = await requireSession();
  return prisma.user.upsert({
    where: { authUserId: session.user.id },
    update: {},
    create: { authUserId: session.user.id },
  });
}

export async function createMeeting(data: CreateMeetingDTO) {
  const user = await getOrCreateCurrentUser();
  const roomName = `meeting-${randomUUID().slice(0, 8)}`;
  return prisma.meeting.create({
    data: {
      title: data.title,
      startsAt: new Date(data.startsAt),
      roomName,
      organizerId: user.id,
    },
    select: {
      id: true,
      title: true,
      startsAt: true,
      roomName: true,
      createdAt: true,
    },
  });
}

export async function getUpcomingMeetings() {
  const user = await getOrCreateCurrentUser();
  return prisma.meeting.findMany({
    where: { organizerId: user.id, startsAt: { gte: new Date() } },
    orderBy: { startsAt: 'asc' },
    take: 20,
    select: {
      id: true,
      title: true,
      startsAt: true,
      roomName: true,
      createdAt: true,
    },
  });
}

export async function getPastMeetings() {
  const user = await getOrCreateCurrentUser();
  return prisma.meeting.findMany({
    where: { organizerId: user.id, startsAt: { lt: new Date() } },
    orderBy: { startsAt: 'desc' },
    take: 20,
    select: {
      id: true,
      title: true,
      startsAt: true,
      roomName: true,
      createdAt: true,
    },
  });
}
