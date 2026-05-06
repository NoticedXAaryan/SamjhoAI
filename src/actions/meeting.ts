'use server';

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export type CreateMeetingDTO = {
  title: string;
  startsAt: string;
};

async function getOrCreateCurrentUser() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  return prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: { clerkId: userId },
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
