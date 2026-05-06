// src/features/meetings/__tests__/meetings.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MeetingService } from '../meetings.service';
import type { IMeetingRepository, Meeting } from '../meetings.types';

function makeMeeting(overrides: Partial<Meeting> = {}): Meeting {
  return {
    id: 'test-id',
    roomName: 'test-room',
    title: 'Test Meeting',
    organizerId: 'user-1',
    status: 'scheduled',
    startsAt: new Date(),
    endedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

// D — Dependency Inversion: inject a mock, test in complete isolation
function makeMockRepo(): IMeetingRepository {
  return {
    create: vi.fn().mockResolvedValue({ roomName: 'new-room-id' }),
    findByRoomName: vi.fn().mockResolvedValue(makeMeeting()),
    findUpcomingByUser: vi.fn().mockResolvedValue([makeMeeting()]),
    findPastByUser: vi.fn().mockResolvedValue([makeMeeting({ status: 'ended' })]),
    markActive: vi.fn().mockResolvedValue(undefined),
    markEnded: vi.fn().mockResolvedValue(undefined),
  };
}

describe('MeetingService', () => {
  let repo: IMeetingRepository;
  let service: MeetingService;

  beforeEach(() => {
    repo = makeMockRepo();
    service = new MeetingService(repo);
  });

  describe('createMeeting', () => {
    it('creates a meeting and returns a roomName', async () => {
      const result = await service.createMeeting('My Meeting', 'user-1');
      expect(result.roomName).toBe('new-room-id');
      expect(repo.create).toHaveBeenCalledWith({
        title: 'My Meeting',
        organizerId: 'user-1',
      });
    });

    it('creates a meeting with undefined title', async () => {
      const result = await service.createMeeting(undefined, 'user-1');
      expect(result.roomName).toBe('new-room-id');
      expect(repo.create).toHaveBeenCalledWith({
        title: undefined,
        organizerId: 'user-1',
      });
    });
  });

  describe('validateAndJoin', () => {
    it('marks a scheduled meeting as active and returns it', async () => {
      const result = await service.validateAndJoin('test-room');
      expect(result.roomName).toBe('test-room');
      expect(result.title).toBe('Test Meeting');
      expect(repo.markActive).toHaveBeenCalledWith('test-room');
    });

    it('does not re-mark an already active meeting', async () => {
      vi.mocked(repo.findByRoomName).mockResolvedValueOnce(
        makeMeeting({ status: 'active' })
      );
      const result = await service.validateAndJoin('test-room');
      expect(result.roomName).toBe('test-room');
      expect(repo.markActive).not.toHaveBeenCalled();
    });

    it('throws for ended meetings', async () => {
      vi.mocked(repo.findByRoomName).mockResolvedValueOnce(
        makeMeeting({ status: 'ended' })
      );
      await expect(service.validateAndJoin('test-room')).rejects.toThrow(
        'Meeting has already ended.'
      );
    });

    it('throws for non-existent meetings', async () => {
      vi.mocked(repo.findByRoomName).mockResolvedValueOnce(null);
      await expect(service.validateAndJoin('missing-room')).rejects.toThrow(
        'Meeting not found'
      );
    });
  });

  describe('getUpcoming', () => {
    it('returns upcoming meetings for user', async () => {
      const result = await service.getUpcoming('user-1');
      expect(result).toHaveLength(1);
      expect(repo.findUpcomingByUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getPast', () => {
    it('returns past meetings for user', async () => {
      const result = await service.getPast('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('ended');
      expect(repo.findPastByUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('endMeeting', () => {
    it('ends a meeting when called by organizer', async () => {
      await service.endMeeting('test-room', 'user-1');
      expect(repo.markEnded).toHaveBeenCalledWith('test-room', 'user-1');
    });

    it('throws when meeting not found', async () => {
      vi.mocked(repo.findByRoomName).mockResolvedValueOnce(null);
      await expect(service.endMeeting('missing', 'user-1')).rejects.toThrow(
        'Meeting not found'
      );
    });

    it('throws when non-organizer tries to end', async () => {
      await expect(service.endMeeting('test-room', 'other-user')).rejects.toThrow(
        'Only the host can end'
      );
    });
  });
});
