import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { requireSession } from '@/features/auth/session';

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();

    const { searchParams } = new URL(req.url);
    const room = searchParams.get('room');

    if (!room) {
      return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'LiveKit credentials not configured' }, { status: 500 });
    }

    const participantName = session.user.name ?? session.user.email ?? 'Anonymous User';

    const at = new AccessToken(apiKey, apiSecret, {
      identity: session.user.id,
      name: participantName,
    });

    at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true });

    const token = await at.toJwt();
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Failed to generate LiveKit token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
