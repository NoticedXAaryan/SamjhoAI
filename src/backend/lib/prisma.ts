import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma__: PrismaClient | undefined;
}

function normalizeDatabaseUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl) return rawUrl;
  try {
    const url = new URL(rawUrl);

    // Prisma + Neon pooler is more stable with these params.
    if (url.hostname.includes('-pooler.')) {
      if (!url.searchParams.has('pgbouncer')) {
        url.searchParams.set('pgbouncer', 'true');
      }
      if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', '1');
      }
    }

    if (!url.searchParams.has('sslmode')) {
      url.searchParams.set('sslmode', 'require');
    }

    // `channel_binding=require` can break some Prisma/driver stacks.
    if (url.searchParams.get('channel_binding') === 'require') {
      url.searchParams.delete('channel_binding');
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

export const prisma =
  globalThis.__prisma__ ??
  new PrismaClient({
    datasources: {
      db: {
        url: normalizeDatabaseUrl(process.env.DATABASE_URL),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma__ = prisma;
}
