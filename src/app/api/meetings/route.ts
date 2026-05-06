import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

async function getOrCreateUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: { clerkId: userId },
    select: { id: true },
  });
  return user.id;
}

export async function GET() {
  try {
    const userId = await getOrCreateUserId();
    const now = new Date();

    const [upcoming, past] = await Promise.all([
      prisma.meeting.findMany({
        where: { organizerId: userId, startsAt: { gte: now } },
        orderBy: { startsAt: 'asc' },
        take: 20,
        select: { id: true, title: true, startsAt: true, roomName: true },
      }),
      prisma.meeting.findMany({
        where: { organizerId: userId, startsAt: { lt: now } },
        orderBy: { startsAt: 'desc' },
        take: 20,
        select: { id: true, title: true, startsAt: true, roomName: true },
      }),
    ]);

    return NextResponse.json({ upcoming, past });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal Server Error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getOrCreateUserId();
    const body = (await req.json().catch(() => null)) as null | {
      title?: string;
      startsAt?: string;
    };

    const meeting = await prisma.meeting.create({
      data: {
        title: body?.title?.trim() || 'New meeting',
        startsAt: body?.startsAt ? new Date(body.startsAt) : new Date(),
        roomName: `meeting-${crypto.randomUUID().slice(0, 8)}`,
        organizerId: userId,
      },
      select: { id: true, title: true, startsAt: true, roomName: true },
    });

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal Server Error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

