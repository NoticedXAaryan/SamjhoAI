import { NextRequest, NextResponse } from 'next/server';

function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return res;
}

export async function middleware(req: NextRequest) {
  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg)$).*)'],
};

