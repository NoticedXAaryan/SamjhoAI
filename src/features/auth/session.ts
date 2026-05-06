import { headers } from 'next/headers';
import { getAuth } from './auth.server';

export async function getSession() {
  const auth = await getAuth();
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

