import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/meeting(.*)']);

// In-memory rate limiter (swap for Upstash Redis when scaling)
const rl = new Map<string, { n: number; reset: number }>();

function isRateLimited(key: string, max = 60): boolean {
  const now = Date.now();
  const e = rl.get(key) ?? { n: 0, reset: now + 60_000 };
  if (now > e.reset) {
    rl.set(key, { n: 1, reset: now + 60_000 });
    return false;
  }
  if (e.n >= max) return true;
  e.n++;
  rl.set(key, e);
  return false;
}

function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  return res;
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';

  // Rate limit — 60 req/min per IP per path
  if (isRateLimited(`${ip}:${pathname}`)) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  return addSecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg)$).*)'],
};
