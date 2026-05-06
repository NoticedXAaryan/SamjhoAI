import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { getDb } from '@/shared/db/client';

async function createAuth() {
  const db = await getDb();
  return betterAuth({
    database: mongodbAdapter(db),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'],
  });
}

type AuthInstance = Awaited<ReturnType<typeof createAuth>>;

let _auth: AuthInstance | undefined;

export async function getAuth(): Promise<AuthInstance> {
  if (_auth) return _auth;
  _auth = await createAuth();
  return _auth;
}

