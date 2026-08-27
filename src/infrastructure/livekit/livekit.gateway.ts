import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

export interface LiveKitParticipantTokenInput {
  roomName: string;
  participantId: string;
  participantName: string;
  isHost: boolean;
  isGuest: boolean;
}

function credentials() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) throw new Error('LiveKit credentials not configured.');
  return { apiKey, apiSecret };
}

function administrationUrl() {
  const configured = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!configured) throw new Error('LiveKit server URL not configured.');
  return configured.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
}

export async function createLiveKitParticipantToken(input: LiveKitParticipantTokenInput) {
  const { apiKey, apiSecret } = credentials();
  const token = new AccessToken(apiKey, apiSecret, {
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
  const { apiKey, apiSecret } = credentials();
  await new RoomServiceClient(administrationUrl(), apiKey, apiSecret).deleteRoom(roomName);
}
