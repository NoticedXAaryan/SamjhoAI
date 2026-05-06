import type { Room } from 'livekit-client';
import type { CaptionPacket } from '@/features/captions/captions.types';

export async function broadcastCaption(room: Room, caption: CaptionPacket): Promise<void> {
  if (!room?.localParticipant) return;
  const payload = new TextEncoder().encode(JSON.stringify(caption));
  await room.localParticipant.publishData(payload, { reliable: false });
}

export function parseCaptionPacket(payload: Uint8Array): CaptionPacket | null {
  try {
    return JSON.parse(new TextDecoder().decode(payload)) as CaptionPacket;
  } catch {
    return null;
  }
}
