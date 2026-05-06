// src/features/captions/__tests__/captions.repository.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TranscriptSegment } from '../captions.types';

// Mock the prisma client before importing the repository
const mockMeetingFindUnique = vi.fn();
const mockTranscriptCreate = vi.fn();
const mockTranscriptFindMany = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    meeting: {
      findUnique: (...args: unknown[]) => mockMeetingFindUnique(...args),
    },
    transcript: {
      create: (...args: unknown[]) => mockTranscriptCreate(...args),
      findMany: (...args: unknown[]) => mockTranscriptFindMany(...args),
    },
  },
}));

import { PrismaCaptionRepository } from '../captions.repository';

const testSegment: TranscriptSegment = {
  timestamp: 1700000000000,
  type: 'speech',
  content: 'Hello world',
  userId: 'user-1',
  userName: 'Alice',
  language: 'en-US',
  confidence: 0.95,
};

describe('PrismaCaptionRepository', () => {
  let repo: PrismaCaptionRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new PrismaCaptionRepository();
  });

  describe('appendSegment', () => {
    it('creates a transcript record for an existing meeting', async () => {
      mockMeetingFindUnique.mockResolvedValueOnce({ id: 'meeting-id' });
      mockTranscriptCreate.mockResolvedValueOnce({});

      await repo.appendSegment('room-1', testSegment);

      expect(mockMeetingFindUnique).toHaveBeenCalledWith({
        where: { roomName: 'room-1' },
        select: { id: true },
      });
      expect(mockTranscriptCreate).toHaveBeenCalledWith({
        data: {
          meetingId: 'meeting-id',
          content: JSON.stringify(testSegment),
        },
      });
    });

    it('silently skips when meeting not found', async () => {
      mockMeetingFindUnique.mockResolvedValueOnce(null);

      await repo.appendSegment('missing-room', testSegment);

      expect(mockTranscriptCreate).not.toHaveBeenCalled();
    });
  });

  describe('findByRoomName', () => {
    it('returns parsed transcript segments in order', async () => {
      mockMeetingFindUnique.mockResolvedValueOnce({ id: 'meeting-id' });
      mockTranscriptFindMany.mockResolvedValueOnce([
        { content: JSON.stringify(testSegment) },
        { content: JSON.stringify({ ...testSegment, content: 'Second line' }) },
      ]);

      const result = await repo.findByRoomName('room-1');

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Hello world');
      expect(result[1].content).toBe('Second line');
    });

    it('returns empty array when meeting not found', async () => {
      mockMeetingFindUnique.mockResolvedValueOnce(null);

      const result = await repo.findByRoomName('missing-room');

      expect(result).toEqual([]);
    });

    it('filters out malformed JSON rows', async () => {
      mockMeetingFindUnique.mockResolvedValueOnce({ id: 'meeting-id' });
      mockTranscriptFindMany.mockResolvedValueOnce([
        { content: JSON.stringify(testSegment) },
        { content: 'not-json{{{' },
        { content: JSON.stringify({ ...testSegment, content: 'Third line' }) },
      ]);

      const result = await repo.findByRoomName('room-1');

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Hello world');
      expect(result[1].content).toBe('Third line');
    });
  });
});
