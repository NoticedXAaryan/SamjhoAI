// src/features/captions/captions.types.ts

export interface CaptionPacket {
  id: string;
  userId: string;
  userName: string;
  type: 'speech' | 'gesture';
  content: string;
  gestureType?: string;
  language: string;
  confidence: number;
  timestamp: number;
}

export interface TranscriptSegment {
  timestamp: number;
  type: 'speech' | 'gesture';
  content: string;
  userId: string;
  userName: string;
  language: string;
  confidence: number;
  gestureType?: string;
}

export interface ICaptionRepository {
  appendSegment(roomName: string, segment: TranscriptSegment): Promise<void>;
  findByRoomName(roomName: string): Promise<TranscriptSegment[]>;
}
