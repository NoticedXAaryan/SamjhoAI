import { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma.js';
import { verifyAccess, TokenPayload } from '../lib/jwt.js';

interface UserData {
  id: string;
  name: string;
  role: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking: boolean;
  isHandRaised: boolean;
  initials: string;
}

export function registerSocketHandlers(io: Server): void {
  // ── Auth middleware: validate JWT on socket connect ────────────────────────
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth.accessToken ?? socket.handshake.query.token;
    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = verifyAccess(token) as TokenPayload;
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, name: true, email: true },
      });
      if (!user) return next(new Error('User not found'));

      socket.data.authenticated = true;
      socket.data.userPayload = { ...user, email: payload.email };
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Connected: ${socket.id} (user: ${socket.data.userPayload?.name})`);

    // ── Join a meeting room ──────────────────────────────────────────────────
    socket.on('join-room', async (meetingId: string, userDetails: Omit<UserData, 'id'>) => {
      // Verify user has access to this meeting
      const dbUser = socket.data.userPayload;
      const participation = await prisma.participant.findUnique({
        where: { userId_meetingId: { userId: dbUser.id, meetingId } },
      });

      // If not a participant yet, auto-join as GUEST
      if (!participation) {
        try {
          await prisma.participant.create({
            data: { userId: dbUser.id, meetingId, role: 'GUEST' },
          });
        } catch {
          // Meeting might not exist yet — allow join anyway for instant meetings
        }
      }

      socket.join(meetingId);

      const user: UserData = { id: socket.id, ...userDetails };
      socket.data.meetingId = meetingId;
      socket.data.user = user;

      console.log(`[Socket] ${user.name} (${socket.id}) joined room ${meetingId}`);

      // Send existing participants to the newcomer
      const roomSockets = io.sockets.adapter.rooms.get(meetingId);
      if (roomSockets) {
        const existing = Array.from(roomSockets)
          .filter((id) => id !== socket.id)
          .map((id) => io.sockets.sockets.get(id)?.data.user)
          .filter(Boolean) as UserData[];
        socket.emit('existing-participants', existing);
      }

      // Notify everyone else
      socket.to(meetingId).emit('user-connected', user);

      // Mark meeting as active
      try {
        await prisma.meeting.updateMany({
          where: { id: meetingId, status: 'SCHEDULED' },
          data: { status: 'ACTIVE' },
        });
      } catch {
        // Non-blocking
      }
    });

    // ── State change (mute, video, hand raise) ───────────────────────────────
    socket.on('state-change', (meetingId: string, state: Partial<UserData>) => {
      socket.data.user = { ...socket.data.user, ...state };
      socket.to(meetingId).emit('user-state-changed', { id: socket.id, ...state });
    });

    // ── Chat message ─────────────────────────────────────────────────────────
    socket.on('chat-message', async (meetingId: string, message: { text: string; senderName: string }) => {
      const dbUser = socket.data.userPayload;
      const senderName = message.senderName || socket.data.user?.name || 'Guest';

      // Persist to database
      try {
        await prisma.message.create({
          data: {
            meetingId,
            senderId: dbUser?.id || socket.id,
            senderName,
            text: message.text,
          },
        });
      } catch {
        // Non-blocking — broadcast regardless
      }

      const payload = {
        id: `${Date.now()}-${socket.id}`,
        senderId: dbUser?.id || socket.id,
        senderName,
        text: message.text,
        timestamp: new Date().toISOString(),
      };

      io.to(meetingId).emit('chat-message', payload);
    });

    // ── WebRTC signaling relay ───────────────────────────────────────────────
    socket.on('offer', (payload: { to: string; offer: RTCSessionDescriptionInit }) => {
      io.to(payload.to).emit('offer', { from: socket.id, offer: payload.offer });
    });

    socket.on('answer', (payload: { to: string; answer: RTCSessionDescriptionInit }) => {
      io.to(payload.to).emit('answer', { from: socket.id, answer: payload.answer });
    });

    socket.on('ice-candidate', (payload: { to: string; candidate: RTCIceCandidateInit }) => {
      io.to(payload.to).emit('ice-candidate', { from: socket.id, candidate: payload.candidate });
    });

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      const meetingId = socket.data.meetingId;
      if (meetingId) {
        socket.to(meetingId).emit('user-disconnected', socket.id);
      }
    });
  });
}
