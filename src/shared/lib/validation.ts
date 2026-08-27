// src/shared/lib/validation.ts

import { z } from 'zod';

export const MeetingTitleSchema = z.string().min(1).max(100).optional();

export const RoomNameSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-z0-9-]+$/, 'Invalid room code format');

export const GuestDisplayNameSchema = z
  .string()
  .trim()
  .min(2, 'Enter a display name with at least 2 characters.')
  .max(80, 'Display name must be 80 characters or fewer.')
  .regex(/^[^<>\u0000-\u001f\u007f]+$/, 'Display name contains unsupported characters.');

export const CaptionSegmentSchema = z.object({
  timestamp: z.number(),
  type: z.enum(['speech', 'gesture']),
  content: z.string().min(1).max(5000),
  userId: z.string().min(1),
  userName: z.string().min(1).max(200),
  language: z.string().min(1).max(10),
  confidence: z.number().min(0).max(1),
  gestureType: z.string().optional(),
});

export const CaptionPacketSchema = CaptionSegmentSchema.extend({
  id: z.string().uuid(),
});

/** Validate input with Zod — throws on failure */
export function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(result.error.issues[0].message);
  return result.data;
}
