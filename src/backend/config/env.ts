import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_ORIGIN: z.string().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().optional(), // No longer used for signing — kept for backwards compat
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Optional: TURN server for WebRTC
  TURN_URL: z.string().optional(),
  TURN_USER: z.string().optional(),
  TURN_PASS: z.string().optional(),

  // Optional: Email (Resend API or SMTP)
  EMAIL_FROM: z.string().default('noreply@samjho.ai'),
  EMAIL_RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
export const env = envSchema.parse(process.env);
