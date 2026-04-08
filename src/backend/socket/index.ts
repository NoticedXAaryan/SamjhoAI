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
  isPresenting: boolean;
  initials: string;
}

const MAX_MEETING_SIZE = 8;
const MAX_CHAT_MESSAGE_LENGTH = 5000;
const SOCKET_CLEANUP_INTERVAL = 5 * 60_000; // 5 min cleanup for expired rate-limit entries

// Socket connection rate limiting (per IP)
const socketConnectionMap = new Map<string, { count: number; windowStart: number }>();
const SOCKET_CONN_WINDOW = 60_000; // 1 min window
const SOCKET_MAX_CONN_PER_WINDOW = 10;

function checkSocketRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = socketConnectionMap.get(ip);
  if (!entry || now - entry.windowStart > SOCKET_CONN_WINDOW) {
    socketConnectionMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= SOCKET_MAX_CONN_PER_WINDOW) return false;
  entry.count++;
  return true;
}

// Periodically clean up expired rate-limit entries
const socketCleanup = setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of socketConnectionMap) {
    if (now - entry.windowStart > SOCKET_CONN_WINDOW) socketConnectionMap.delete(ip);
  }
}, SOCKET_CLEANUP_INTERVAL);
socketCleanup.unref(); // Don't prevent process exit

/** Call this on server shutdown to stop the cleanup timer. */
export function stopSocketCleanup(): void {
  clearInterval(socketCleanup);
}

export function registerSocketHandlers(io: Server): void {
  // ── Auth middleware: validate JWT on socket connect ────────────────────────
  io.use(async (socket: Socket, next) => {
    // Rate limit socket connections per IP
    const ip = socket.handshake.address;
    if (!checkSocketRateLimit(ip)) {
      return next(new Error('Too many socket connections. Please try again in a minute.'));
    }

    // Read access token from httpOnly cookie or auth payload
    let token: string | undefined;

    // Try accessToken from auth (legacy / fallback)
    if (socket.handshake.auth.accessToken && typeof socket.handshake.auth.accessToken === 'string') {
      token = socket.handshake.auth.accessToken;
    } else if (socket.handshake.query.token && typeof socket.handshake.query.token === 'string') {
      token = socket.handshake.query.token;
    }

    // Parse httpOnly cookie from handshake
    if (!token) {
      const rawCookie = socket.handshake.headers.cookie;
      if (typeof rawCookie === 'string') {
        const match = rawCookie.match(/accessToken=([^;]+)/);
        if (match) {
          token = decodeURIComponent(match[1]);
        }
      }
    }

    if (!token) {
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
      const dbUser = socket.data.userPayload;

      // Check meeting size
      const roomSockets = io.sockets.adapter.rooms.get(meetingId);
      const currentSize = roomSockets ? roomSockets.size : 0;
      if (currentSize >= MAX_MEETING_SIZE) {
        socket.emit('meeting-full', { max: MAX_MEETING_SIZE });
        return;
      }

      const participation = await prisma.participant.findUnique({
        where: { userId_meetingId: { userId: dbUser.id, meetingId } },
      });

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

      console.log(`[Socket] ${user.name} (${socket.id}) joined room ${meetingId} (${currentSize + 1}/${MAX_MEETING_SIZE})`);

      const updatedRoom = io.sockets.adapter.rooms.get(meetingId);
      if (updatedRoom) {
        const existing = Array.from(updatedRoom)
          .filter((id) => id !== socket.id)
          .map((id) => io.sockets.sockets.get(id)?.data.user)
          .filter(Boolean) as UserData[];
        socket.emit('existing-participants', existing);
      }

      socket.to(meetingId).emit('user-connected', user);

      try {
        await prisma.meeting.updateMany({
          where: { id: meetingId, status: 'SCHEDULED' },
          data: { status: 'ACTIVE' },
        });
      } catch {
        // Non-blocking
      }
    });

    // ── Rejoin room (on reconnect) — don't broadcast to others ───────────────
    socket.on('rejoin-room', async (meetingId: string, stateUpdate: Partial<Pick<UserData, 'isMuted' | 'isVideoOff' | 'isHandRaised'>>) => {
      const dbUser = socket.data.userPayload;
      if (!dbUser) return socket.disconnect();

      socket.join(meetingId);
      socket.data.meetingId = meetingId;

      if (socket.data.user) {
        socket.data.user = { ...socket.data.user, ...stateUpdate };
      }

      const roomSockets = io.sockets.adapter.rooms.get(meetingId);
      if (roomSockets) {
        const existing = Array.from(roomSockets)
          .filter((id) => id !== socket.id)
          .map((id) => io.sockets.sockets.get(id)?.data.user)
          .filter(Boolean) as UserData[];
        socket.emit('existing-participants', existing);
      }

      console.log(`[Socket] ${dbUser.name} (${socket.id}) rejoined room ${meetingId}`);
    });

    // ── State change (mute, video, hand raise, presenting) ──────────────────
    socket.on('state-change', (meetingId: string, state: Partial<Pick<UserData, 'isMuted' | 'isVideoOff' | 'isHandRaised' | 'isPresenting'>>) => {
      socket.data.user = { ...socket.data.user, ...state };
      socket.to(meetingId).emit('user-state-changed', { id: socket.id, ...state });
    });

    // ── Chat message ─────────────────────────────────────────────────────────
    socket.on('chat-message', async (meetingId: string, message: { text: string }) => {
      const dbUser = socket.data.userPayload;
      if (!dbUser || !socket.data.user) return;

      // Enforce message length limit
      const text = message.text?.trim();
      if (!text || text.length === 0) return;
      if (text.length > MAX_CHAT_MESSAGE_LENGTH) {
        socket.emit('chat-error', { error: `Message must be under ${MAX_CHAT_MESSAGE_LENGTH} characters` });
        return;
      }

      const senderName = socket.data.user.name; // Always use authenticated name

      try {
        await prisma.message.create({
          data: {
            meetingId,
            senderId: dbUser.id,
            senderName,
            text,
          },
        });
      } catch {
        // Non-blocking — broadcast regardless
      }

      const payload = {
        id: `${Date.now()}-${socket.id}`,
        senderId: dbUser.id,
        senderName,
        text,
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

    // ── End meeting for all (host only) ──────────────────────────────────────
    socket.on('end-meeting', async (meetingId: string) => {
      const dbUser = socket.data.userPayload;
      if (!dbUser) return;

      // Verify this user is the host
      const participation = await prisma.participant.findUnique({
        where: { userId_meetingId: { userId: dbUser.id, meetingId } },
      });
      if (participation?.role !== 'HOST') {
        socket.emit('end-meeting-error', 'Only the host can end the meeting');
        return;
      }

      // Mark meeting as completed and kick all participants
      await prisma.meeting.updateMany({
        where: { id: meetingId, status: 'ACTIVE' },
        data: { status: 'COMPLETED', scheduledEndAt: new Date() },
      });

      io.to(meetingId).emit('meeting-ended', { reason: 'host-ended' });

      // Disconnect all sockets in the room
      const room = io.sockets.adapter.rooms.get(meetingId);
      if (room) {
        for (const socketId of room) {
          const s = io.sockets.sockets.get(socketId);
          if (s) s.disconnect(true);
        }
      }
    });

    // ── Screen share state broadcast ─────────────────────────────────────────
    socket.on('presenting-change', (meetingId: string, isPresenting: boolean) => {
      socket.data.user = { ...socket.data.user, isPresenting };
      socket.to(meetingId).emit('user-state-changed', { id: socket.id, isPresenting });
    });

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      const meetingId = socket.data.meetingId;
      if (meetingId) {
        socket.to(meetingId).emit('user-disconnected', socket.id);

        // If room is now empty, mark meeting as completed
        const room = io.sockets.adapter.rooms.get(meetingId);
        if (!room || room.size === 0) {
          try {
            await prisma.meeting.updateMany({
              where: { id: meetingId, status: 'ACTIVE' },
              data: { status: 'COMPLETED', scheduledEndAt: new Date() },
            });
          } catch {
            // Non-blocking
          }
        }
      }
    });
  });
}
