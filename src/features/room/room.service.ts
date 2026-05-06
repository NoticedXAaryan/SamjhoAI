// src/features/room/room.service.ts
// S — Single Responsibility: only LiveKit token + room utilities

import { AccessToken } from 'livekit-server-sdk';

export async function generateLiveKitToken(
  roomName: string,
  userId: string,
  userName: string
): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('LiveKit credentials not configured');
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: userName,
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  return await at.toJwt();
}
