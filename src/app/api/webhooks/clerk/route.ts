import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Clerk webhooks are deprecated (migrated to Better Auth).' },
    { status: 410 }
  );
}
