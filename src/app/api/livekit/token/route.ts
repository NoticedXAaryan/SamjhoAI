import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { getSession } from '@/lib/auth';
import { PrismaMeetingRepository } from '@/features/meetings/meetings.repository';
import { MeetingService } from '@/features/meetings/meetings.service';
import { RoomNameSchema } from '@/shared/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = RoomNameSchema.safeParse(body?.roomName);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid meeting link.' }, { status: 400 });
    }
    const room = parsed.data;

    const meeting = await new MeetingService(new PrismaMeetingRepository()).validateAndJoin(room);
    const isHost = meeting.organizerId === session.user.id;

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'LiveKit credentials not configured' }, { status: 500 });
    }

    const participantName = session.user.name || 'Anonymous User';

    const at = new AccessToken(apiKey, apiSecret, {
      identity: `${session.user.id}:${crypto.randomUUID()}`,
      name: participantName,
      metadata: JSON.stringify({ userId: session.user.id, isHost }),
      ttl: '10m',
    });

    at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true });

    const token = await at.toJwt();
    return NextResponse.json(
      { token, title: meeting.title, isHost },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Failed to generate LiveKit token:', error);
    const message = error instanceof Error ? error.message : 'Unable to join meeting.';
    const status = message.includes('not found') ? 404 : message.includes('ended') ? 410 : 500;
    return NextResponse.json({ error: status === 500 ? 'Unable to join meeting.' : message }, { status });
  }
}
