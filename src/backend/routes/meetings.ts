import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const createSchema = z.object({
  title: z.string().min(1).default('Instant Meeting'),
  date: z.string().optional(),
  time: z.string().optional(),
  scheduledStartAt: z.string().datetime().optional(),
});

// POST /api/meetings — create a meeting
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.issues[0].message });
    return;
  }

  const { title, date, time, scheduledStartAt } = parse.data;

  // Build the scheduledStartAt datetime
  let startAt: Date;
  if (scheduledStartAt) {
    startAt = new Date(scheduledStartAt);
  } else if (date && time) {
    startAt = new Date(`${date}T${time}`);
  } else {
    startAt = new Date();
  }

  const meeting = await prisma.meeting.create({
    data: {
      title,
      hostId: req.user!.userId,
      scheduledStartAt: startAt,
      status: 'SCHEDULED',
      participants: {
        create: {
          userId: req.user!.userId,
          role: 'HOST',
        },
      },
    },
    include: {
      host: { select: { id: true, name: true, email: true } },
      participants: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  res.status(201).json(meeting);
});

// GET /api/meetings — list the authenticated user's meetings
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const meetings = await prisma.meeting.findMany({
    where: {
      participants: { some: { userId: req.user!.userId } },
      status: { in: ['SCHEDULED', 'ACTIVE'] },
    },
    orderBy: { scheduledStartAt: 'asc' },
    include: {
      host: { select: { id: true, name: true } },
      _count: { select: { participants: true } },
    },
  });

  res.json(meetings);
});

// GET /api/meetings/:id — get a single meeting (participant check)
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: req.params.id,
      OR: [
        { hostId: req.user!.userId },
        { participants: { some: { userId: req.user!.userId } } },
      ],
    },
    include: {
      host: { select: { id: true, name: true } },
      _count: { select: { participants: true } },
    },
  });

  if (!meeting) {
    res.status(404).json({ error: 'Meeting not found or you do not have access' });
    return;
  }

  res.json(meeting);
});

// DELETE /api/meetings/:id — cancel (host only)
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const meeting = await prisma.meeting.findUnique({ where: { id: req.params.id } });

  if (!meeting) {
    res.status(404).json({ error: 'Meeting not found' });
    return;
  }

  if (meeting.hostId !== req.user!.userId) {
    res.status(403).json({ error: 'Only the host can cancel this meeting' });
    return;
  }

  await prisma.meeting.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED' },
  });

  res.json({ success: true });
});

// GET /api/meetings/:id/participants — list meeting participants
router.get('/:id/participants', requireAuth, async (req: Request, res: Response) => {
  // Verify user has access to this meeting
  const hasAccess = await prisma.participant.findFirst({
    where: { meetingId: req.params.id, userId: req.user!.userId },
  });
  if (!hasAccess) {
    res.status(403).json({ error: 'You do not have access to this meeting' });
    return;
  }

  const participants = await prisma.participant.findMany({
    where: { meetingId: req.params.id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  res.json(participants);
});

// GET /api/meetings/:id/messages — load chat message history
router.get('/:id/messages', requireAuth, async (req: Request, res: Response) => {
  // Verify user has access to this meeting
  const hasAccess = await prisma.participant.findFirst({
    where: { meetingId: req.params.id, userId: req.user!.userId },
  });
  if (!hasAccess) {
    res.status(403).json({ error: 'You do not have access to this meeting' });
    return;
  }

  const messages = await prisma.message.findMany({
    where: { meetingId: req.params.id },
    orderBy: { createdAt: 'asc' },
    take: 200,
  });

  res.json(messages);
});

export default router;
