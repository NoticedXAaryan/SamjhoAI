import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Better Auth disabled (using Clerk).' }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: 'Better Auth disabled (using Clerk).' }, { status: 404 });
}

