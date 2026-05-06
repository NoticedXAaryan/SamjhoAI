export type CaptionPacket = {
  id: string;
  userId: string;
  userName: string;
  type: 'speech';
  content: string;
  timestamp: number;
};

export type TranscriptSegment = {
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
};

