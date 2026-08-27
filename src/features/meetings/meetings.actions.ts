// src/features/meetings/meetings.actions.ts
// Thin server actions — authenticate, then delegate to service
// O — Open/Closed: adding new meeting features means adding new actions, not editing this file

'use server';

import { getSession } from '@/lib/auth';
import { validate, MeetingTitleSchema, RoomNameSchema } from '@/shared/lib/validation';
import { PrismaMeetingRepository } from './meetings.repository';
import { MeetingService } from './meetings.service';
import { deleteLiveKitRoom } from '@/infrastructure/livekit/livekit.gateway';

async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session?.user.id) throw new Error('Unauthorized');
  return session.user.id;
}

function makeService() {
  return new MeetingService(new PrismaMeetingRepository());
}

export async function createMeeting(rawTitle?: string) {
  const title = validate(MeetingTitleSchema, rawTitle);
  const userId = await requireUserId();
  return makeService().createMeeting(title, userId);
}

export async function validateAndJoinMeeting(rawRoomName: string) {
  const roomName = validate(RoomNameSchema, rawRoomName);
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

export async function endMeeting(rawRoomName: string) {
  const roomName = validate(RoomNameSchema, rawRoomName);
  const userId = await requireUserId();
  await makeService().endMeeting(roomName, userId);

  await deleteLiveKitRoom(roomName);
}
