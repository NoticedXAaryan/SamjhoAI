import type { Room } from 'livekit-client';
import type { CaptionPacket } from '@/features/captions/captions.types';
import { CaptionPacketSchema } from '@/shared/lib/validation';

export const CAPTION_TOPIC = 'samjho-caption-v1';
export const LOCAL_CAPTION_EVENT = 'samjho:local-caption';

export async function broadcastCaption(room: Room, caption: CaptionPacket): Promise<void> {
  if (!room?.localParticipant) return;
  const payload = new TextEncoder().encode(JSON.stringify(caption));
  window.dispatchEvent(new CustomEvent<CaptionPacket>(LOCAL_CAPTION_EVENT, { detail: caption }));
  await room.localParticipant.publishData(payload as any, { reliable: true, topic: CAPTION_TOPIC });
}

export function parseCaptionPacket(payload: Uint8Array): CaptionPacket | null {
  try {
    const parsed = CaptionPacketSchema.safeParse(JSON.parse(new TextDecoder().decode(payload)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
