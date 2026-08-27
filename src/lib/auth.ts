import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { headers } from 'next/headers';
import { getAuthEnvironment } from '@/config/env';
import { prisma } from '@/lib/prisma';

const authEnvironment = getAuthEnvironment();

export const auth = betterAuth({
  appName: 'Samjho AI',
  baseURL: authEnvironment.BETTER_AUTH_URL,
  secret: authEnvironment.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    database: { joins: true },
  },
  plugins: [nextCookies()],
});

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
