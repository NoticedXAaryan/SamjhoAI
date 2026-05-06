// src/shared/lib/__tests__/validation.test.ts
import { describe, it, expect } from 'vitest';
import {
  MeetingTitleSchema,
  RoomNameSchema,
  CaptionSegmentSchema,
  validate,
} from '../validation';

describe('MeetingTitleSchema', () => {
  it('accepts undefined (optional)', () => {
    expect(MeetingTitleSchema.safeParse(undefined).success).toBe(true);
  });

  it('accepts a valid title', () => {
    expect(MeetingTitleSchema.safeParse('Team standup').success).toBe(true);
  });

  it('rejects empty string', () => {
    expect(MeetingTitleSchema.safeParse('').success).toBe(false);
  });

  it('rejects title longer than 100 characters', () => {
    expect(MeetingTitleSchema.safeParse('x'.repeat(101)).success).toBe(false);
  });
});

describe('RoomNameSchema', () => {
  it('accepts valid room names', () => {
    expect(RoomNameSchema.safeParse('meeting-abc12345').success).toBe(true);
  });

  it('rejects empty string', () => {
    expect(RoomNameSchema.safeParse('').success).toBe(false);
  });

  it('rejects room names with uppercase', () => {
    expect(RoomNameSchema.safeParse('Meeting-ABC').success).toBe(false);
  });

  it('rejects room names with special characters', () => {
    expect(RoomNameSchema.safeParse('room@123').success).toBe(false);
  });

  it('rejects room names longer than 50 characters', () => {
    expect(RoomNameSchema.safeParse('a'.repeat(51)).success).toBe(false);
  });
});

describe('CaptionSegmentSchema', () => {
  const validSegment = {
    timestamp: Date.now(),
    type: 'speech' as const,
    content: 'Hello world',
    userId: 'user-1',
    userName: 'Alice',
    language: 'en-US',
    confidence: 0.95,
  };

  it('accepts a valid speech segment', () => {
    expect(CaptionSegmentSchema.safeParse(validSegment).success).toBe(true);
  });

  it('accepts a valid gesture segment', () => {
    expect(
      CaptionSegmentSchema.safeParse({
        ...validSegment,
        type: 'gesture',
        gestureType: 'wave',
      }).success
    ).toBe(true);
  });

  it('rejects invalid type', () => {
    expect(
      CaptionSegmentSchema.safeParse({ ...validSegment, type: 'invalid' }).success
    ).toBe(false);
  });

  it('rejects empty content', () => {
    expect(
      CaptionSegmentSchema.safeParse({ ...validSegment, content: '' }).success
    ).toBe(false);
  });

  it('rejects confidence > 1', () => {
    expect(
      CaptionSegmentSchema.safeParse({ ...validSegment, confidence: 1.5 }).success
    ).toBe(false);
  });

  it('rejects missing userId', () => {
    const { userId, ...rest } = validSegment;
    expect(CaptionSegmentSchema.safeParse(rest).success).toBe(false);
  });
});

describe('validate helper', () => {
  it('returns parsed value for valid input', () => {
    expect(validate(RoomNameSchema, 'meeting-123')).toBe('meeting-123');
  });

  it('throws Error with message for invalid input', () => {
    expect(() => validate(RoomNameSchema, '')).toThrow();
  });

  it('throws Error (not ZodError) for invalid input', () => {
    try {
      validate(RoomNameSchema, '');
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).message).toBeTruthy();
    }
  });
});
