import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const protectedPrefixes = ['/dashboard', '/meeting'];
const authPrefixes = ['/sign-in', '/sign-up'];
const rl = new Map<string, { count: number; resetAt: number }>();
const MAX_RATE_LIMIT_KEYS = 10_000;

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), display-capture=(self)');
  return response;
}

function isRateLimited(key: string, max = 60) {
  const now = Date.now();
  const entry = rl.get(key);
  if (!entry || entry.resetAt < now) {
    if (!entry && rl.size >= MAX_RATE_LIMIT_KEYS) {
      const oldestKey = rl.keys().next().value as string | undefined;
      if (oldestKey) rl.delete(oldestKey);
    }
    rl.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= max) return true;
  entry.count += 1;
  return false;
}

function rateLimitGroup(pathname: string, method: string) {
  if (pathname.startsWith('/api/auth')) return method === 'GET' ? 'auth:read' : 'auth:write';
  if (pathname === '/api/livekit/token') return 'livekit:token';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/meeting')) return 'meeting';
  return 'public';
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/health/live' || pathname === '/health/ready') {
    return addSecurityHeaders(NextResponse.next());
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const requestLimit = pathname.startsWith('/api/auth') && request.method !== 'GET' ? 10 : 60;
  if (isRateLimited(`${ip}:${rateLimitGroup(pathname, request.method)}`, requestLimit)) {
    const response = new NextResponse('Too Many Requests', { status: 429 });
    response.headers.set('Retry-After', '60');
    return addSecurityHeaders(response);
  }

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = authPrefixes.some((prefix) => pathname.startsWith(prefix));
  if (isProtected || isAuthPage) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session && isProtected) {
      const url = new URL('/sign-in', request.url);
      url.searchParams.set('callbackURL', `${pathname}${request.nextUrl.search}`);
      return addSecurityHeaders(NextResponse.redirect(url));
    }
    if (session && isAuthPage) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)));
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg)$).*)'],
};
