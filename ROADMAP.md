# Production Roadmap — Samjho

> Target: support 100 concurrent users (scalable beyond that).
> Each step is short, independently testable, and has acceptance criteria (AC) at the end.
> Any AI model (Claude, Cursor, GPT, etc.) can pick up from any step and continue.

---

## Project Anatomy (for context)

```
accessibility-video-conferencing/
├── schema.prisma                  ← DB schema (User, Meeting, Participant, Message)
├── server.ts                      ← Entry point, bootstraps Express + Vite middleware
├── render.yaml                    ← Render deploy config
├── .env / .env.example            ← Environment variables
├── src/
│   ├── App.tsx                    ← Router (/, /auth, /dashboard, /meeting, /download)
│   ├── main.tsx                   ← React entry point
│   ├── pages/
│   │   ├── LandingPage.tsx        ← Marketing landing
│   │   ├── AuthPage.tsx           ← Login/Register
│   │   ├── DashboardPage.tsx      ← Meeting list, schedule, calendar, device settings (static)
│   │   ├── MeetingPage.tsx        ← Active meeting (video, WebRTC, Socket, chat, captions)
│   │   └── DownloadPage.tsx
│   ├── components/ui/Effects.tsx  ← CursorGlow, NoiseOverlay
│   ├── store/useAppStore.ts       ← Zustand store (minimal, unused for now)
│   ├── lib/
│   │   ├── api.ts                 ← Frontend API client (auth + meetings)
│   │   ├── utils.ts               ← cn() helper (clsx+tailwind-merge)
│   │   ├── useMeetingMedia.ts     ← Hook: MediaPipe hand tracking, Web Speech STT, audio analyser
│   │   └── useMediaDevices.ts     ← Hook: enumerateDevices device selection
│   └── backend/
│       ├── index.ts               ← Express app + Socket.IO setup
│       ├── config/env.ts          ← Zod-validated env vars
│       ├── lib/prisma.ts          ← Prisma singleton
│       ├── lib/jwt.ts             ← JWT sign/verify
│       ├── middleware/auth.ts     ← requireAuth middleware
│       ├── routes/
│       │   ├── auth.ts            ← POST /register, /login, /refresh, GET /me, POST /logout
│       │   └── meetings.ts       ← CRUD: create, list, get, delete, participants, messages
│       └── socket/index.ts        ← Socket.IO: join-room, chat, WebRTC signaling, state-change
└── package.json                   ← Scripts: dev, build, start, prisma:*
```

---

## Phase-by-Phase Roadmap

### PHASE 1 — Fix Local Dev & First Smoke Test
Make sure `npm run dev` boots, you can log in, create a meeting, and join it.

#### Step 1.1 — Verify dev build boots
- Run: `npm run dev`
- Verify the server starts on `http://localhost:3000`
- Open in browser, confirm landing page renders
- **AC**: Landing page loads without errors in console

#### Step 1.2 — Verify auth works end-to-end
- Navigate to `/auth`, register a new account
- Confirm redirect to `/dashboard`
- Check localStorage for `accessToken`, `refreshToken`, `user`
- Logout, verify redirect to `/`
- **AC**: Register → Dashboard → Logout → Login cycle works

#### Step 1.3 — Verify dashboard API calls
- Open dashboard, verify your network tab shows a `GET /api/meetings` call
- Click "New Meeting" → should create a DB record and navigate to `/meeting?id=...`
- **AC**: Meeting created in DB (verify via Prisma Studio: `npm run prisma:studio`)

#### Step 1.4 — Fix known bug: `createPeerConnection` removed from useReducer
- In MeetingPage.tsx, `useEffect` for Socket.io lists `createPeerConnection` in deps but function is `useCallback` — verify the dependency array is correct.
- Verify the current code builds without errors: `npx tsc --noEmit`
- **AC**: `npx tsc --noEmit` returns zero errors

#### Step 1.5 — Test WebSocket connection
- Join a meeting page, open browser dev tools → Network → WS
- Confirm `socket.io` connection succeeds (status 101)
- **AC**: Socket connects, no auth errors in server logs

---

### PHASE 2 — Wire up Real Media Pipeline (Current code exists but partially)

These features already exist in `useMeetingMedia.ts` but were not fully wired into MeetingPage. The wiring is already done.

#### Step 2.1 — Verify hand tracking loads
- Open a meeting with video ON
- Open browser console, confirm no `MediaPipe` import errors
- Show your hand to the camera
- **AC**: Bottom-left self-view shows "Detected: ✋ Open Palm" (or similar) in the HandTrackingIndicator badge

#### Step 2.2 — Verify speech-to-text works
- Speak while AI toggle is ON
- Bottom of meeting screen should show real-time transcript text in CaptionsOverlay
- **AC**: Your spoken words appear as captions (interim then final) in the meeting UI

#### Step 2.3 — Verify gesture-to-caption pipeline
- Make a recognizable gesture (✋, ✌️, 👍, ✊, etc.)
- **AC**: HandTrackingIndicator shows the detected gesture; CaptionsOverlay shows "Sign detected: [gesture]" when no speech is happening

#### Step 2.4 — Verify AI toggle controls everything
- Toggle AI button OFF
- **AC**: Captions freeze, hand tracking stops, speech recognition stops (verify `stopHandTracking()` called, SpeechRecognition stopped)

#### Step 2.5 — Test device selection
- Open settings (gear icon) in meeting
- Select a different microphone/camera from dropdown
- **AC**: Video feed switches to the new camera, audio uses the new mic

---

### PHASE 3 — Real-Time Speaking Indicator (Audio Analyser)

#### Step 3.1 — Verify speaking detection on local user is visible
- This should already work via the `createSpeakingAnalyser()` in useMeetingMedia.
- Open meeting, speak into mic
- **AC**: The participant list should show an audio meter or green dot for the local user when speaking

#### Step 3.2 — Add speaking indicator to speaker tile
- In MeetingPage, the local user's self-view tile needs an `isSpeaking` indicator.
- Create a `isLocalSpeaking` state from the analyser (currently only works for remote).
- Add a green pulsing dot to the self-view tile when `isLocalSpeaking` is true.
- **AC**: Self-view tile gets a green speaking indicator when you speak

---

### PHASE 4 — WebRTC Hardening (Critical for 100 users)
#### Step 4.1 — Add Coturn/TURN server support
- Add TURN server ICE config in `createPeerConnection`:
  ```ts
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: process.env.TURN_URL, username: process.env.TURN_USER, credential: process.env.TURN_PASS }
  ]
  ```
- Add `TURN_URL`, `TURN_USER`, `TURN_PASS` to `.env` and schema in `env.ts`
- **AC**: `createPeerConnection` sends TURN credentials, no build errors

#### Step 4.2 — Test WebRTC between two different browsers
- Open two browser tabs (different profiles or Chrome + Firefox)
- Log in as User A, create meeting, open link in User B
- **AC**: Both users see each other's video (not just black screens or loading spinners)

#### Step 4.3 — Fix the "existing-participants" race condition
- Current code sends `user-connected` event to others BEFORE the answer/offer is ready
- Modify `socket/index.ts` to delay `user-connected` until after peer connection is created
- **AC**: Adding a third participant doesn't break video for participants 1 or 2

#### Step 4.4 — Add connection recovery
- When a peer's WebRTC connection state is `failed`, attempt to restart ICE:
  ```ts
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'failed') {
      pc.restartIce();
    }
  };
  ```
- **AC**: Brief network drop doesn't permanently disconnect a user's video

#### Step 4.5 — Handle the "only one user in meeting" scenario
- When a user is alone, the video area shows "Waiting for others to join..." (already implemented).
- Verify it looks good (centered, readable).
- **AC**: Single-user meeting page is visually clean, no errors

#### Step 4.6 — Test 5-party call (local simulation)
- Open 5 tabs, all join same meeting
- **AC**: All 5 participants see all others (4 remote + self), audio doesn't feedback-loop (all remotes should be muted on self), video loads for each

---

### PHASE 5 — Security & Rate Limiting
#### Step 5.1 — Add `express-rate-limit`
- Install: `npm i express-rate-limit`
- Rate limit auth endpoints: 5 requests per 60 seconds on `/api/auth/login` and `/api/auth/register`
- **AC**: Brute force script gets `429 Too Many Requests` after 5 attempts

#### Step 5.2 — Add `helmet` security headers properly
- `helmet` is already installed and used with `contentSecurityPolicy: false`.
- Re-enable CSP for production with appropriate `script-src` and `connect-src` directives
- **AC**: `curl -I http://localhost:3000` shows security headers

#### Step 5.3 — CSRF protection
- For socket auth via `accessToken`, JWT validation exists
- Add rate limiting on socket connections (max 10 per minute per IP)
- **AC**: Can't flood socket connections

---

### PHASE 6 — Production Infrastructure
#### Step 6.1 — Add health check endpoint with DB connectivity
- Current: `/health` only returns `{status: "ok", timestamp}` — doesn't check DB
- Modify `/health` to ping Prisma with `SELECT 1`
- If DB fails, return 503
- **AC**: When DB is down, health check returns 503 (monitors can alert)

#### Step 6.2 — Fix Neon cold start issue
- Render starts before Neon wakes up → Prisma migration fails
- Add a startup script in `server.ts` that retries DB connection before serving
- ```ts
  async function waitForDB(retries = 10, delayMs = 3000) {
    for (let i = 0; i < retries; i++) {
      try { await prisma.$queryRaw`SELECT 1`; return; }
      catch { if (i === retries-1) throw; await sleep(delayMs); }
    }
  }
  ```
- **AC**: Render deploy succeeds even with cold-start DB

#### Step 6.3 — Add Neon DB keepalive cron
- Add `/api/cron/warmup` endpoint that verifies DB connection
- Set up a free cron job (like cron-job.org or UptimeRobot) to hit it every 4 minutes
- **AC**: DB stays warm, first request after idle loads in <2 seconds

---

### PHASE 7 — Socket Reconnection & State Recovery
#### Step 7.1 — Implement socket auto-reconnect ✅ DONE
- Added `rejoin-room` server handler that sends back existing participants without broadcasting `user-connected` to others
- Frontend uses `initialConnect` flag to emit `join-room` once, then `rejoin-room` on reconnect
- **AC**: ✅ If you kill the server and restart it, the frontend automatically reconnects and rejoins the meeting room

#### Step 7.2 — Catch up on missed messages ✅ DONE
- On reconnect, `meetingsApi.messages(meetingId)` is called to refetch all chat messages
- Toast notification shows "Reconnected to meeting"
- **AC**: ✅ Reconnecting user's chat shows all previous messages

#### Step 7.3 — Meeting auto-completed when empty
- Server socket `disconnect` handler checks if room is empty; if so, marks meeting as `COMPLETED` in DB
- **AC**: Last person leaving marks meeting as completed

#### Step 7.4 — Test reconnect by simulating a drop
- Use Chrome DevTools → Network → Offline, wait 5 seconds, go Online
- **AC**: User reconnects within 10 seconds, video resumes, chat is intact

---

### PHASE 8 — Performance & Scale
#### Step 8.1 — Lazy-load expensive components
- `MeetingPage` loads MediaPipe (`@mediapipe/tasks-vision`) on first render
- Move the dynamic import to a lazy hook or code-split it
- **AC**: MeetingPage initial bundle loads 100ms+ faster (measure with Lighthouse)

#### Step 8.2 — Optimize MediaPipe to run in a Web Worker
- Hand tracking runs on the main thread, can block UI
- Move MediaPipe `HandLandmarker` to a Web Worker (`worker.ts`)
- PostMessage landmarks back to main thread
- **AC**: Hand tracking doesn't cause frame drops in the meeting

#### Step 8.3 — Add connection stats for remote participants
- Display latency/packet loss in the sidebar for debugging
- **AC**: Connection stats visible in participants tab

#### Step 8.4 — Reduce memory leak risk ✅ DONE
- Fixed `requestAnimationFrame` leak in `registerSpeakingAnalyser` — stores `rafId` in analyser object, cancels on unregister
- Meeting leave now stops local media tracks, hand tracking, speaking analysers, and clears all peer connections
- **AC**: `chrome://webrtc-internals` shows clean cleanup, no lingering connections

---

### PHASE 9 — Polish & Production Readiness
#### Step 9.1 — Add error boundary
- Wrap the app in a React `ErrorBoundary` component
- Show a recovery screen if the app crashes (with reload button)
- **AC**: Intentional crash shows error page, not white screen

#### Step 9.2 — Add toast notifications
- Install `sonner` or `react-hot-toast`
- Show toasts for: connected, disconnected, error, muted, screen sharing
- **AC**: User actions show feedback toasts

#### Step 9.3 — Add loading skeletons
- Dashboard → loading state while fetching meetings
- Meeting page → loading state during media device setup
- **AC**: No blank screens during API/network fetches

#### Step 9.4 — Fix participant tile key warnings
- In `ParticipantTile`, `keyProp` usage is wrong — it's passed as `keyProp={p.id}` but the map already has `key={p.id}` (for some calls). Clean this up.
- **AC**: Console has zero React key warnings for participant tiles

#### Step 9.5 - Accessibility audit
- Tab navigation works across all controls (mute, video, join, leave)
- Screen reader announces: "you are muted", "user joined", "new message from X"
- **AC**: Lighthouse accessibility score > 90

---

### PHASE 10 — ML Model Integration (Custom Sign Language Recognition)
> The custom ML model will replace/supplement the MediaPipe gesture classification.
> This phase prepares the pipeline for model serving, real-time inference, and result broadcasting.

#### Step 10.1 — ML Backend Endpoints
- Add `POST /api/ml/inference` endpoint that accepts base64-encoded hand landmark data or image frames
- Add `GET /api/model/status` to check if the ML model is loaded and ready
- Add WebSocket event `ml-result` to broadcast real-time gesture predictions to all meeting participants
- **AC**: ML endpoint responds with gesture prediction in <50ms; all participants in meeting receive results

#### Step 10.2 — Frontend ML Pipeline Integration
- In `useMeetingMedia.ts`, send detected hand landmarks to custom ML model instead of relying solely on geometric classification
- Fallback to MediaPipe geometric rules if ML model is unavailable
- Store gesture timeline in component state for later export
- **AC**: Hand tracking shows ML model predictions when available, falls back to geometric rules gracefully

#### Step 10.3 — Gesture Data Export for Training
- Add `POST /api/ml/training-data` endpoint to save detected gesture samples (landmarks + label)
- Export button in meeting page: "Export session gesture data as JSON"
- **AC**: Can download all gestures from a meeting session as JSON file with timestamps, landmarks, and labels

#### Step 10.4 — Real-time Caption Translation from ML Model
- ML model predictions get appended to the live captions (same pipeline as speech-to-text)
- Distinguish between speech captions and gesture captions visually in CaptionsOverlay
- Persist ML-detected gestures to the `Message` table as system messages for transcript
- **AC**: Captions show both spoken words and ML-detected signs with visual distinction

#### Step 10.5 — Model Loading from Backend
- Serve ML model files (`.onnx`, `.tflite`, or `.json`) from Express static route
- Frontend loads model dynamically: `fetch('/api/model/sign-classifier.onnx')`
- Add loading indicator while model initializes
- **AC**: Model loads from server, not hardcoded client-side path; shows loading state during init

---

### PHASE 11 — Missing Core Features
> Features that are noticeably lacking for a usable product.

#### Step 11.1 — Media Permission Handling
- When `getUserMedia` fails due to denied permissions, show a modal with instructions
- Provide "Open browser settings" guidance for Chrome/Firefox/Safari
- Pre-join screen should request mic and camera separately; let user proceed with mic-only if camera denied
- **AC**: Denied permissions shows clear error modal, app doesn't silently fail

#### Step 11.2 — Real Transcript (Speech + Gesture History)
- Currently the "Transcript" tab just shows chat messages
- Save speech-to-text final transcripts to a new `transcript_entries` table (meetingId, type, content, speaker, timestamp)
- Types: 'speech' (from Web Speech API), 'gesture' (from MediaPipe/ML model)
- Transcript tab pulls from this table
- **AC**: Transcript tab shows all spoken words and detected gestures in chronological order

#### Step 11.3 — Dashboard Settings: Real Device Selection
- Dashboard settings tab shows hardcoded text "Default - System Audio"
- Integrate `useMediaDevices` hook into dashboard settings
- Let users test mic (show audio level meter) and preview camera
- **AC**: Settings tab lists real devices, shows audio meter, previews camera feed

#### Step 11.4 — End Meeting for All (Host)
- Add "End Meeting for Everyone" option in the leave modal (only for meeting host)
- Server emits `meeting-ended` event; all participants get kicked to the "meeting ended" screen
- **AC**: Host can end meeting for all; guests see "Host ended the meeting" screen

#### Step 11.5 — Screen Share State Sync
- Screen sharing currently replaces video track locally but doesn't broadcast to others
- Emit `state-change: { isScreenSharing: true }` via socket
- Other participants see "User is presenting" indicator on that participant's tile
- **AC**: When someone shares screen, others see an indicator

#### Step 11.6 — Connection Recovery Badge
- When socket is reconnecting, show a "Reconnecting..." badge in the top bar
- Use the existing `isSocketConnected` state
- **AC**: User sees visual indicator when connection drops and recovers

---

### PHASE 12 — Pre-Launch (100 users ready)
#### Step 10.1 — Set up Neon connection pooling
- Use Supavisor or PgBouncer
- Configure `DATABASE_URL` to point to the pooler, connection_limit to a reasonable number
- **AC**: Can handle 50+ simultaneous DB connections without errors

#### Step 10.2 — Set up monitoring
- Install `@sentry/node` and `@sentry/react`
- Capture errors in Sentry dashboard
- **AC**: Error shows in Sentry dashboard after triggering

#### Step 10.3 — Set up basic analytics
- Install `posthog-js`
- Track: page views, meeting created, meeting joined, meeting duration
- **AC**: PostHog dashboard shows event data

#### Step 10.4 — Load test
- Use `artillery` or `k6` to load test:
  - Auth endpoint: 50 req/s for 30 seconds
  - WebSocket: 50 concurrent connections
- **AC**: 95% of requests succeed in <500ms, no crashes

#### Step 10.5 — Final deploy checklist
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] DB backup created
- [ ] `.env` has all production secrets
- [ ] Health check monitoring active
- [ ] Sentry connected
- [ ] Error boundary in place
- [ ] Load test completed
- **AC**: Deployed app handles 10 concurrent users without issues

---

## Quick Reference for AI Handoff

When continuing in a new session (Claude, Cursor, other AI), paste:

```
Continue from Phase X, Step X.Y in /ROADMAP.md

Before starting:
1. Read ROADMAP.md to understand the full plan
2. Run `npx tsc --noEmit` to verify current state
3. Run `npm run dev` to verify the app boots
4. Read the specific files mentioned in the current step
5. Follow the step's acceptance criteria
6. After completing, mark the step as DONE in ROADMAP.md
```

---

## Current Status

| Area | Status | Notes |
|------|--------|-------|
| Auth (register/login/logout/refresh) | ✅ Working | End-to-end functional, rate limiting applied |
| Dashboard (API-backed meetings) | ✅ Working | Create, list, schedule, calendar, loading states |
| Socket.io (join room, chat, signaling) | ✅ Working | Auth middleware, room management, reconnect handler exists |
| WebRTC (peer connections) | Working (basic) | STUN only, no TURN, 2-party untested |
| Hand tracking (MediaPipe) | ✅ Wired into UI | Shows gesture text in MeetingPage |
| Speech-to-text (Web Speech API) | ✅ Wired into UI | CaptionsOverlay shows transcript |
| Speaking detection (Audio Analyser) | Working | Fixed RAF memory leak ✅ |
| Device selection (enumerateDevices) | ✅ Working | Real device dropdowns in dashboard settings |
| Rate limiting | ✅ Done | 5 req/60s on login/register/forgot, 10/5min on reset-password |
| Socket reconnection | ✅ Done | `rejoin-room` on reconnect, `join-room` only on first connect via `initialConnect` flag |
| Meeting auto-complete | ✅ Done | Last person leaving marks meeting COMPLETED |
| Memory leak fixes | ✅ Done | RAF loop, cleanup on leave |
| Error boundary | ✅ Done | Wraps all of App |
| Toasts | ✅ Done | Sonner for mute/cam/AI/reconnect/join |
| Loading states | ⚠️ Partially done | Dashboard spinner exists, meeting page loading states needed |
| TypeScript build | ✅ Clean | `npx tsc --noEmit` zero errors |
| TURN servers | ⚠️ Wired | Env vars ready, user must deploy/configure a TURN server |
| WebRTC ICE restart | ✅ Done | `pc.restartIce()` on `failed` state, 3s timeout before teardown |
| Socket rate limit | ✅ Done | 10 conn/min per IP enforced on socket connect |
| Express body limit | ✅ Done | `express.json({ limit: '10mb' })` + urlencoded limit |
| CSP headers | ✅ Done | Production CSP enabled, dev relaxed |
| Graceful shutdown | ✅ Done | SIGTERM drains Socket.IO → closes Prisma → exits |
| Global error handler | ✅ Done | Catches unhandled Express errors with 500 JSON response |
| End meeting for all | ✅ Done | Host can end for everyone via `meeting-ended` socket event |
| Screen share state sync | ✅ Done | `presenting-change` + `isPresenting` state broadcasts to all |
| Max meeting size | ✅ Done | 8 user cap enforced via `join-room` check + `meeting-full` event |
| Connection recovery badge | ✅ Done | Top bar shows connected/reconnecting status |
| Vite port conflict | ✅ Fixed | Vite runs on 5173, proxies to Express on 3000 |
| Password enforcement | ✅ Done | 8+ chars, lowercase, uppercase, number — enforced backend + UI checklist |
| Email in dev | ✅ Fixed | Verification/reset links logged to server console |
| ML model integration | Not started | Phase 10 — no backend endpoints exist |
| Real transcript tab | Missing | Phase 11 — just shows chat currently |

**Last updated: 2026-04-07** — Auth system fully fixed: Prisma schema synced (OTP→token fields), email verification with clickable links, password reset with rate limiting, avatar picker in settings, real device dropdowns in dashboard. `npx tsc --noEmit` passes clean. All endpoints tested via curl (register, login, forgot, reset, profile update, email verify). Phase 5 (rate limiting): complete on all 4 auth endpoints. Phase 10 (ML) and Phase 11 (end meeting for all, real transcript tab) remain.

---

## Environment Variables

### Local Development (`.env`)
```
NODE_ENV=development
PORT=3000
APP_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://...  (Neon or local Postgres)
JWT_SECRET=<64-char-hex>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<64-char-hex-different>
JWT_REFRESH_EXPIRES_IN=7d
VITE_API_URL=http://localhost:3000
# Phase 4: TURN support
# TURN_URL=turn:your-turn-server:3478
# TURN_USER=your-turn-username
# TURN_PASS=your-turn-password
```

### Production (Render Environment)
Same as above plus:
```
NODE_ENV=production
APP_ORIGIN=your-cf-pages-domain.com
DATABASE_URL=  (Neon connection string with sslmode=require)
SENTRY_DSN=  (Phase 10)
POSTHOG_KEY= (Phase 10)
```

---

## Testing Script (Manual Checklist)

Run after each phase:

```
[ ] npm run dev → boots without errors
[ ] npx tsc --noEmit → zero errors
[ ] Register new account → /dashboard loads
[ ] Create instant meeting → /meeting loads
[ ] Camera shows in self-view
[ ] Microphone captures audio (no errors in console)
[ ] Hand tracking detects gestures (see indicator)
[ ] Speech-to-text shows captions
[ ] AI toggle turns features on/off
[ ] Settings modal shows real device names
[ ] Device switch works while in call
[ ] Chat sends/receives messages
[ ] Logout → login cycle works
```
