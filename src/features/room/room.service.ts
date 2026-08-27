// src/features/room/room.service.ts
// Compatibility wrapper. New server-side LiveKit behavior belongs in the gateway.

import { createLiveKitParticipantToken } from '@/infrastructure/livekit/livekit.gateway';

export async function generateLiveKitToken(
  roomName: string,
  userId: string,
  userName: string
): Promise<string> {
  return createLiveKitParticipantToken({
    roomName,
    participantId: userId,
    participantName: userName,
    isHost: false,
    isGuest: false,
  });
}
