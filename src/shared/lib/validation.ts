// src/shared/lib/validation.ts

import { z } from 'zod';

export const MeetingTitleSchema = z.string().min(1).max(100).optional();

export const RoomIdSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-z0-9-]+$/, 'Invalid room code format');

/** Wrap server actions for safe error handling */
export function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(result.error.issues[0].message);
  return result.data;
}
