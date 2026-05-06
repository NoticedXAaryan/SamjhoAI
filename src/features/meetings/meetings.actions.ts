// src/features/meetings/meetings.actions.ts
// Thin server actions — authenticate, then delegate to service
// O — Open/Closed: adding new meeting features means adding new actions, not editing this file

'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { PrismaMeetingRepository } from './meetings.repository';
import { MeetingService } from './meetings.service';

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  // Upsert user in our DB
  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: { clerkId: userId },
    select: { id: true },
  });
  return user.id;
}

function makeService() {
  return new MeetingService(new PrismaMeetingRepository());
}

export async function createMeeting(title?: string) {
  const userId = await requireUserId();
  return makeService().createMeeting(title, userId);
}

export async function validateAndJoinMeeting(roomName: string) {
  await requireUserId();
  return makeService().validateAndJoin(roomName);
}

export async function getUpcomingMeetings() {
  const userId = await requireUserId();
  return makeService().getUpcoming(userId);
}

export async function getPastMeetings() {
  const userId = await requireUserId();
  return makeService().getPast(userId);
}

export async function endMeeting(roomName: string) {
  const userId = await requireUserId();
  return makeService().endMeeting(roomName, userId);
}
