import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { getLiveKitEnvironment } from '@/config/env';

export interface LiveKitParticipantTokenInput {
  roomName: string;
  participantId: string;
  participantName: string;
  isHost: boolean;
  isGuest: boolean;
}

export async function createLiveKitParticipantToken(input: LiveKitParticipantTokenInput) {
  const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = getLiveKitEnvironment();
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: `${input.participantId}:${crypto.randomUUID()}`,
    name: input.participantName,
    metadata: JSON.stringify({
      userId: input.participantId,
      isHost: input.isHost,
      isGuest: input.isGuest,
    }),
    ttl: '6h',
  });

  token.addGrant({
    roomJoin: true,
    room: input.roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  return token.toJwt();
}

export async function deleteLiveKitRoom(roomName: string) {
  const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = getLiveKitEnvironment();
  await new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET).deleteRoom(roomName);
}
