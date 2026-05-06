import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '@/features/auth/auth.server';

export async function GET(request: Request) {
  const auth = await getAuth();
  const { GET } = toNextJsHandler(auth);
  return GET(request);
}

export async function POST(request: Request) {
  const auth = await getAuth();
  const { POST } = toNextJsHandler(auth);
  return POST(request);
}

