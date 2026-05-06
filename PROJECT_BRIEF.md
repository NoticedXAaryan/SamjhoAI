# Samjho AI — Project Brief

> Real-time accessible video conferencing with sign language recognition, live translation, and transcription.

## Project Overview

A full-stack video conferencing application designed for accessibility — enabling deaf/hard-of-hearing users and people with speech impairments to communicate seamlessly. The app combines WebRTC video calling with AI-powered hand gesture recognition (ASL), speech-to-text transcription, and (planned) real-time translation.

---

## Tech Stack

### Frontend
- **React 19** + TypeScript
- **Vite 6** for bundling
- **TailwindCSS v4** for styling
- **Framer Motion (motion/react)** for animations
- **GSAP** for calendar animations
- **Three.js / React Three Fiber** for 3D landing page background
- **Socket.IO Client** for real-time events
- **Route**: react-router-dom v7
- **Notifications**: Sonner toast library

### Backend
- **Express.js v4** with TypeScript
- **Socket.IO v4** for WebRTC signaling + real-time events
- **Prisma ORM v6** with PostgreSQL (Neon managed)
- **bcryptjs** for password hashing (cost factor 12)
- **jsonwebtoken (HS256)** for access (15min) + refresh (7d) tokens
- **express-rate-limit** for auth rate limiting
- **Nodemailer** with Gmail SMTP (personal app password)
- **Helmet** for CSP, **Morgan** for logging
- **tsx** for ESM TypeScript execution

### Deployment
- **Frontend**: Cloudflare Pages (via Wrangler)
- **Backend**: Render
- **Database**: Neon PostgreSQL (serverless)
- **Email**: Gmail SMTP (samjhoaii@gmail.com)

---

## Routes & Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with 3D background, feature cards, CTA |
| `/auth` | Login / Register / Forgot Password / Reset Password / Email Verified |
| `/dashboard` | Meeting calendar, past meetings, upcoming meetings, scheduling |
| `/meeting?id=...` | Video meeting room (pre-join screen + active meeting) |
| `/download` | Simple app download page |

---

## Features That Currently Work

### Auth
- Register with email/password (firstName + lastName required)
- Login + auto logout on token expiry
- Email verification via link (Gmail SMTP sends verification email)
- Password reset via email link (forgotten password flow)
- Change password (authenticated)
- Profile update (name + avatar selection from 16 icon options)
- Account lockout after 5 failed login attempts (15-minute lock)
- JWT access token (15min) + refresh token (7d) with auto-refresh on 401

### Meetings
- Create instant meeting from dashboard
- Schedule meeting with date + time
- Join meeting from dashboard or direct link (`/meeting?id=...`)
- Delete meeting (host only)
- Meeting link copy + share
- Meeting calendar (month view with GSAP slide animation)
- Meeting cards with status badges (Live, Upcoming, Completed, Cancelled)
- Meeting info modal (meeting ID, host name, participant count)

### Video Call (In-Meeting)
- Webcam + microphone on/off
- Screen sharing (starts, but **only local** — other participants don't see it)
- Mute / unmute / raise hand / lower hand
- Grid view + speaker view layouts
- In-meeting participant list with speaking indicator
- In-meeting text chat (saved to DB)
- Meeting timer
- Keyboard shortcuts (M=mute, V=video, H=hand)
- Host can end meeting for everyone
- Socket reconnection logic (5 attempts, increasing delay)
- WebRTC ICE config endpoint (supports dynamic TURN if configured)

### AI / Accessibility
- MediaPipe Hand Landmarker — detects ASL hand gestures with geometric classification
- Open Palm, Thumbs Up, Peace, OK, I Love You, Pointing, Fist, Three, Four, Rock On, Call Me
- Web Speech API — speech-to-text (English only, local browser recognition)
- Speaking detection via Web Audio API RMS analysis per participant
- AI toggle button (enable/disable all AI features during meeting)
- Captions overlay showing speech text + detected gestures

### Email
- Gmail SMTP with app password
- Custom dark theme email templates (cyan/blue gradient, matches app design)
- Verification email template
- Password reset email template
- Dev mode prints verification links to console

### Mobile
- Fully responsive across all pages (mobile-first, desktop preserved)
- Dynamic viewport height (`100dvh`) for mobile browsers
- Smaller touch targets on mobile
- Full-width sidebar on mobile devices

---

## Database Schema (Prisma)

### User
- `id`, `email` (unique), `name`, `passwordHash`
- `emailVerified` (bool, default false)
- `emailVerificationToken` (string, nullable)
- `passwordResetToken` (string, nullable)
- `passwordResetExpires` (DateTime, nullable)
- `failedLoginAttempts` (int, default 0)
- `lockedUntil` (DateTime, nullable)
- `avatarId` (int, default 0)
- `preferences` (JSON, nullable) — **exists in schema but unused in the app**
- `createdAt`, `updatedAt`

### Meeting
- `id`, `title`, `status` (SCHEDULED/ACTIVE/COMPLETED/CANCELLED)
- `scheduledStartAt`, `scheduledEndAt`
- `hostId` (FK to User, RESTRICT on delete)
- `participants` (relation)

### Participant
- `id`, `userId`, `meetingId` (unique composite)
- `role` (HOST/CO_HOST/GUEST/INTERPRETER)
- `joinedAt`, `leftAt`
- **CO_HOST** and **INTERPRETER** roles exist in enum but have no UI/backend logic yet

### Message
- `id`, `meetingId`, `senderId`, `senderName`, `text`, `createdAt`

---

## Architecture

```
Browser (React)          Cloudflare Pages
    │                          │
    │  Vite dev: localhost:5173
    │  prod:  yourdomain.pages.dev
    │
    └── HTTP/WebSocket ──►  Render (Express + Socket.IO)  :3000
                                  │
                                  ├── Prisma ──► Neon PostgreSQL
                                  └── Nodemailer ──► Gmail SMTP
```

- Vite dev server proxies `/socket.io` to `localhost:3000` for local dev
- Socket.IO used for: WebRTC offer/answer relay, ICE candidate relay, chat, participant join/leave, state sync, meeting-end broadcast
- WebRTC is **peer-to-peer** (no SFU). Each participant connects directly to every other participant
- Maximum meeting size: **8 participants** (hardcoded in socket handler)
- No STUN/TURN server currently configured (uses Google's public STUN servers)

---

## What Does NOT Work (or is broken)

### Critical
1. **Screen sharing is local-only** — `toggleScreenShare` replaces the local video track and broadcasts a `presenting-change` event, but other participants don't render a "presenter view" or re-render the shared screen. They still see the user's camera.
2. **Speech-to-text captions don't reach other participants** — captions are generated locally via Web Speech API but never sent to other peers via socket. Each user only sees their own speech as captions.
3. **No real language translation** — despite the app being positioned as a translation tool, there is no text translation between languages. Speech recognition is English-only (`en-US`).
4. **No text-to-speech (TTS)** — there's no Web Speech `SpeechSynthesis` for outputting text as audio.

### Missing Features
5. **No settings/preferences page** — the `preferences` JSON column exists in the User model but is never read or written. No accessibility settings (font size, contrast, notifications, keyboard shortcuts).
6. **No meeting recording** — no ability to record meetings or export transcripts.
7. **No host controls** — no ability to mute/kick/lock participants, just end the meeting.
8. **No co-host/interpreter role management** — DB has these roles but no UI to assign them.
9. **No meeting notifications/reminders** — no email or push notification before scheduled meetings.
10. **No transcript export** — the sidebar has a `transcript` tab but it doesn't render anything meaningful. No download as TXT/PDF.
11. **No search/filter for meetings** — can't search past meetings or filter by date range.
12. **Only dark mode** — no light/follow system theme.

---

## Known Code Issues

### Security
1. **Refresh token rotation not implemented** — same refresh token works for its entire 7-day lifetime. No token blacklist or DB tracking. If stolen, attacker has persistent access.
2. **Tokens in localStorage** — accessible to any JavaScript running on page (XSS vector). `HttpOnly` cookies would be more secure.
3. **CSP uses `'unsafe-inline'`** in production — weakens content security policy.
4. **Health check always returns 200** — even when DB is disconnected, masking real failures.
5. **`VITE_API_URL` in backend `.env`** — unnecessary but not harmful.

### Performance
6. **`MeetingCard` component defined inside DashboardPage render** — creates a new component on every render. Should be extracted.
7. **`handleDeleteMeeting` captures stale state** — rollback on error uses closure values instead of refs, so rollback restores outdated data.
8. **`navigateMonth` had stale closure** — recently fixed with functional setState.

### UX
9. **Registration used to await email send** — recently made non-blocking (`sendVerificationEmail(...).catch(...)` instead of `await`).
10. **Logout endpoint is a no-op** — just returns `{ success: true }`, no token invalidation.

---

## Environment Variables

```
NODE_ENV=development|production
PORT=3000
APP_ORIGIN=http://localhost:5173 (frontend URL)
DATABASE_URL=postgresql://... (Neon)
JWT_SECRET=<64-char hex>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<64-char hex>
JWT_REFRESH_EXPIRES_IN=7d
VITE_API_URL=http://localhost:3000
EMAIL_FROM=samjhoaii@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=samjhoaii@gmail.com
SMTP_PASS=<gmail app password>
TURN_URL=<optional>
TURN_USER=<optional>
TURN_PASS=<optional>
```

---

## Project Structure (key files)

```
src/
├── pages/
│   ├── LandingPage.tsx       — 3D hero, feature grid, CTA
│   ├── AuthPage.tsx          — Login/register/forgot/reset/verified
│   ├── DashboardPage.tsx     — Calendar, meeting cards, scheduling, profile sidebar
│   ├── MeetingPage.tsx       — Pre-join screen, video grid, sidebar (chat/participants), controls
│   └── DownloadPage.tsx      — Static download page
├── lib/
│   ├── api.ts                — Auth + Meeting API wrappers, token storage, refresh logic
│   ├── useMeetingMedia.ts    — Hand tracking (MediaPipe), speech-to-text, speaking analyser
│   ├── useMediaDevices.ts    — Enumerate audio/video input devices
│   └── utils.ts              — cn() utility (clsx + tailwind-merge)
├── components/
│   ├── AvatarIcons.tsx       — 16 avatar options (emoji-based)
│   ├── ErrorBoundary.tsx     — Error boundary wrapper
│   └── ui/Effects.tsx        — Background effects (particles, grid)
├── backend/
│   ├── index.ts              — Express app creation, middleware, routes, Socket.IO
│   ├── config/env.ts         — Zod-validated environment loading
│   ├── middleware/auth.ts    — JWT verification middleware
│   ├── routes/
│   │   ├── auth.ts           — Register, login, refresh, verify, reset, profile
│   │   └── meetings.ts       — CRUD + participants + messages
│   ├── socket/
│   │   └── index.ts          — Socket.IO handlers (join, chat, signaling, end-meeting)
│   └── lib/
│       ├── jwt.ts            — Sign/verify access + refresh tokens
│       ├── prisma.ts         — Prisma client singleton
│       ├── email.ts          — Nodemailer transport, send functions
│       └── email-templates.ts — HTML email templates (dark theme)
server.ts                      — Entry point: createBackend().httpServer.listen()
schema.prisma                  — Database schema
package.json                   — Dependencies + scripts
```

---

## Development Commands

```bash
npm run dev            # Starts full app (server.ts spawns frontend + backend)
npm run dev:frontend   # Vite dev server only
npm run dev:backend    # tsx watch backend only
npm run build          # Vite production build
npm run prisma:studio  # Database GUI
```

---

## Goals & Constraints

- **Target audience**: Deaf/hard-of-hearing learners, speech-impaired users, accessibility community
- **Primary value proposition**: Real-time sign language detection + speech-to-text translation during video calls
- **Current meeting limit**: 8 participants (P2P WebRTC scales poorly beyond this)
- **ML training in progress**: Custom ASL model being trained separately (not the current MediaPipe hand landmarks)
- **Not planning SFU architecture** right now — staying with P2P for now, target is ~100 concurrent users across multiple rooms (not 100 in one meeting)
- **Budget**: Free tier hosting where possible (Neon free tier, Render free, Cloudflare free)

---

## Questions for Review

1. Given the P2P limitation and 8-participant cap, what's the most practical path to 30+ participant meetings without a full SFU rewrite?
2. Is the current auth flow (email verification blocking nothing, auto-login on register) acceptable for a production app, or should verification be enforced?
3. The app uses Gmail SMTP with a personal app password. Is this viable for a growing user base, or is there a better free-tier alternative?
4. Speech-to-text is client-side only (Web Speech API). What would it take to make captions shared across all participants in real-time?
5. The `preferences` JSON field in User is unused. What settings would be most impactful to build first?
6. The landing page uses Three.js for background effects. Is this adding value or hurting performance on mobile?
7. Given everything is in one repo (frontend + backend), would splitting them into separate repos improve deployment speed and DX?
8. What low-effort features would make the biggest perceived improvement in app polish?
