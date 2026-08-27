// src/features/meetings/meetings.service.ts
// S — Single Responsibility: only business logic
// D — Dependency Inversion: receives IMeetingRepository, not the concrete class

import type { IMeetingRepository, IMeetingService, Meeting } from './meetings.types';

export class MeetingService implements IMeetingService {
  constructor(private readonly repo: IMeetingRepository) {}

  async createMeeting(title: string | undefined, userId: string) {
    return this.repo.create({ title, organizerId: userId });
  }

  async validateAndJoin(roomName: string) {
    const meeting = await this.repo.findByRoomName(roomName);
    if (!meeting) {
      throw new Error('Meeting not found or already ended.');
    }
    if (meeting.status === 'ended') {
      throw new Error('Meeting has already ended.');
    }
    if (meeting.status === 'scheduled') {
      await this.repo.markActive(roomName);
    }
    return { roomName: meeting.roomName, title: meeting.title, organizerId: meeting.organizerId };
  }

  async getUpcoming(userId: string): Promise<Meeting[]> {
    return this.repo.findUpcomingByUser(userId);
  }

  async getPast(userId: string): Promise<Meeting[]> {
    return this.repo.findPastByUser(userId);
  }

  async endMeeting(roomName: string, userId: string): Promise<void> {
    const meeting = await this.repo.findByRoomName(roomName);
    if (!meeting) throw new Error('Meeting not found.');
    if (meeting.organizerId !== userId) throw new Error('Only the host can end the meeting.');
    if (meeting.status === 'ended') return;
    await this.repo.markEnded(roomName, userId);
  }
}
