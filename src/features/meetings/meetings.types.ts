// src/features/meetings/meetings.types.ts
// I — Interface Segregation: small focused types only

export interface Meeting {
  id: string;
  roomName: string;
  title: string;
  organizerId: string;
  status: 'scheduled' | 'active' | 'ended';
  startsAt: Date;
  endedAt: Date | null;
  createdAt: Date;
}

export interface CreateMeetingInput {
  title?: string;
  organizerId: string;
}

export interface AccessibilityPreferences {
  captionsEnabled: boolean;
  captionsSize: 'sm' | 'md' | 'lg';
  captionsPosition: 'top' | 'bottom';
  gestureDisplayEnabled: boolean;
  highContrast: boolean;
  preferredLanguage: string;
}

// D — Dependency Inversion: depend on this interface, not the implementation
export interface IMeetingRepository {
  create(input: CreateMeetingInput): Promise<Pick<Meeting, 'roomName'>>;
  findByRoomName(roomName: string): Promise<Meeting | null>;
  findUpcomingByUser(userId: string): Promise<Meeting[]>;
  findPastByUser(userId: string): Promise<Meeting[]>;
  markActive(roomName: string): Promise<void>;
  markEnded(roomName: string, organizerId: string): Promise<void>;
}

export interface IMeetingService {
  createMeeting(title: string | undefined, userId: string): Promise<{ roomName: string }>;
  validateAndJoin(roomName: string): Promise<{ roomName: string; title: string }>;
  getUpcoming(userId: string): Promise<Meeting[]>;
  getPast(userId: string): Promise<Meeting[]>;
  endMeeting(roomName: string, userId: string): Promise<void>;
}
