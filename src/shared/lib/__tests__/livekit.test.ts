import { describe, expect, it, vi } from 'vitest';
import type { Room } from 'livekit-client';
import type { CaptionPacket } from '@/features/captions/captions.types';
import {
  broadcastCaption,
  CAPTION_TOPIC,
  LOCAL_CAPTION_EVENT,
  parseCaptionPacket,
} from '../livekit';

const caption: CaptionPacket = {
  id: '2da2b9a2-6fc8-4ff0-958d-ab8e0c1454e3',
  userId: 'user-1',
  userName: 'Test User',
  type: 'speech',
  content: 'Hello everyone',
  language: 'en-US',
  confidence: 0.95,
  timestamp: 1_700_000_000_000,
};

describe('caption data transport', () => {
  it('publishes reliable, topic-scoped data and echoes it locally', async () => {
    const publishData = vi.fn().mockResolvedValue(undefined);
    const room = { localParticipant: { publishData } } as unknown as Room;
    const localListener = vi.fn();
    window.addEventListener(LOCAL_CAPTION_EVENT, localListener);

    await broadcastCaption(room, caption);

    expect(publishData).toHaveBeenCalledTimes(1);
    const [payload, options] = publishData.mock.calls[0] as [Uint8Array, { reliable: boolean; topic: string }];
    expect(new TextDecoder().decode(payload)).toBe(JSON.stringify(caption));
    expect(options).toEqual({
      reliable: true,
      topic: CAPTION_TOPIC,
    });
    expect((localListener.mock.calls[0][0] as CustomEvent<CaptionPacket>).detail).toEqual(caption);
    window.removeEventListener(LOCAL_CAPTION_EVENT, localListener);
  });

  it('parses a valid caption packet', () => {
    const payload = new TextEncoder().encode(JSON.stringify(caption));
    expect(parseCaptionPacket(payload)).toEqual(caption);
  });

  it('rejects malformed or schema-invalid caption packets', () => {
    expect(parseCaptionPacket(new TextEncoder().encode('{bad json'))).toBeNull();
    expect(parseCaptionPacket(new TextEncoder().encode(JSON.stringify({ ...caption, confidence: 4 })))).toBeNull();
  });
});
