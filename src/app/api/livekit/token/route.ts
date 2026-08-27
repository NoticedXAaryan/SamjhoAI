import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { PrismaMeetingRepository } from '@/features/meetings/meetings.repository';
import { MeetingService } from '@/features/meetings/meetings.service';
import { GuestDisplayNameSchema, RoomNameSchema } from '@/shared/lib/validation';
import { createGuestSession, getGuestSession } from '@/features/auth/guest-session';
import { createLiveKitParticipantToken } from '@/infrastructure/livekit/livekit.gateway';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    const body = await req.json().catch(() => null);
    const parsed = RoomNameSchema.safeParse(body?.roomName);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid meeting link.' }, { status: 400 });
    }
    const room = parsed.data;

    const authenticatedUser = session?.user;
    const parsedGuestName = GuestDisplayNameSchema.safeParse(body?.displayName);
    if (!authenticatedUser && !parsedGuestName.success) {
      return NextResponse.json(
        { error: parsedGuestName.error.issues[0]?.message || 'Enter a valid display name.' },
        { status: 400 },
      );
    }

    const meeting = await new MeetingService(new PrismaMeetingRepository()).validateAndJoin(room);
    const existingGuest = authenticatedUser ? null : await getGuestSession(room);
    const createdGuest = !authenticatedUser && existingGuest?.displayName !== parsedGuestName.data
      ? createGuestSession(room, parsedGuestName.data!)
      : null;
    const guestSession = existingGuest?.displayName === parsedGuestName.data
      ? existingGuest
      : createdGuest?.session;
    const participantId = authenticatedUser?.id || guestSession!.guestId;
    const participantName = authenticatedUser?.name || guestSession!.displayName;
    const isHost = Boolean(authenticatedUser && meeting.organizerId === authenticatedUser.id);

    const token = await createLiveKitParticipantToken({
      roomName: room,
      participantId,
      participantName,
      isHost,
      isGuest: !authenticatedUser,
    });
    const response = NextResponse.json(
      { token, title: meeting.title, isHost, userId: participantId, userName: participantName, isGuest: !authenticatedUser },
      { headers: { 'Cache-Control': 'no-store' } },
    );
    if (createdGuest) {
      response.cookies.set(createdGuest.cookie.name, createdGuest.cookie.value, createdGuest.cookie.options);
    }
    return response;
  } catch (error) {
    console.error('Failed to generate LiveKit token:', error);
    const message = error instanceof Error ? error.message : 'Unable to join meeting.';
    const status = message.includes('not found') ? 404 : message.includes('ended') ? 410 : 500;
    return NextResponse.json({ error: status === 500 ? 'Unable to join meeting.' : message }, { status });
  }
}
