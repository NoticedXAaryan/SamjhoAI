# Current state

## Executive finding

Samjho AI is not a Vite application running beside a Next.js application. It is one Next.js App Router application. React is the rendering library used by Next.js, so having both `react` and `next` dependencies is correct. Vite enters only through Vitest and `@vitejs/plugin-react` for tests; it is not a production server or second frontend.

The architecture should not be rewritten into microservices or a custom WebRTC stack. The sound recovery path is to stabilize the existing modular monolith, keep LiveKit as the SFU/media plane, make deployment deterministic, close the product-baseline gaps, and remove stale migration debris.

## Evidence captured on 2026-08-27

- `npm run check` exited successfully.
- ESLint passed.
- TypeScript passed with strict mode enabled.
- Vitest reported 6 test files and 46 passing tests.
- `next build` completed and emitted the expected application routes.
- The same build printed Better Auth missing-base-URL/default-secret errors when environment variables were not set, but still returned success. This is a false-positive quality gate and is tracked as `REL-004`.
- Coverage reported 39.26% statements, 43.56% branches, 34% functions, and 41.21% lines over the narrow configured include set.
- `docker compose config --quiet` succeeded with non-secret audit placeholders. This proves Compose syntax and interpolation only; it does not prove images build, containers start, proxy routes work, or WebRTC media traverses the public network.
- The latest supplied container log showed the database migration completing and Next.js starting, followed by a warning that `next start` was incompatible with standalone output. Commit `3ff3d67` changed the runtime to `node server.js`; a public redeploy after that commit remains to be verified.

## Runtime topology

```text
Browser
  |-- HTTPS --> Dokploy proxy --> Next.js app :3000
  |                                  |-- Better Auth
  |                                  |-- Prisma --> PostgreSQL :5432
  |                                  `-- LiveKit admin API --> LiveKit :7880
  |
  `-- WSS signaling --> Dokploy proxy --> LiveKit :7880
      WebRTC media --> VPS public TCP :7881 / UDP :7882

LiveKit --> Redis :6379
```

The application, PostgreSQL, Redis, and LiveKit are self-hosted containers. No paid conferencing API is required. The browser still communicates with the self-hosted LiveKit service over its public signaling and media endpoints; that is normal and is not outsourcing the meeting to a third-party API.

## Source layout and real boundaries

- `src/app`: Next.js delivery layer—routes, layouts, pages, health endpoints, and the LiveKit token API.
- `src/features`: auth, meetings, room, and caption features.
- `src/infrastructure`: currently the server-side LiveKit adapter.
- `src/lib`: process-wide Better Auth and Prisma clients plus UI utilities.
- `src/shared`: validation, route policy, LiveKit data helpers, shared types, and browser hooks.
- `prisma`: schema and one initial migration.
- `docker-compose.yml`, `Dockerfile`, `deploy`: self-hosting assets.

The codebase graph found a mostly coherent modular monolith, but the intended rule that features never import other features is already violated. Captions imports guest auth, room imports captions, and shared LiveKit types import captions. The current dependency direction is therefore cyclic at the module level even if it compiles.

## Implemented behavior

### Identity and access

- Email/password account creation and sign-in use Better Auth and PostgreSQL-backed sessions.
- Dashboard, meeting index, and meeting summaries are protected.
- A direct `/meeting/{room}` link is public.
- A guest supplies a display name and receives a signed HttpOnly, room-scoped credential without receiving a database user account.
- Host identity is derived from the authenticated meeting organizer, not from client input.

### Meetings

- Authenticated users can create an immediate meeting.
- The dashboard lists non-ended and ended meetings owned by that user.
- A valid account or guest can request a room-scoped LiveKit token.
- The first token request changes a scheduled meeting to active, even when the requester is a guest.
- Hosts can mark a meeting ended and request deletion of the LiveKit room.
- Hosts can view and download the transcript.

### Realtime room

- LiveKit provides multi-party audio/video, remote audio, screen sharing, participant tiles, connection state, participant list, and transient data-channel chat.
- Users receive microphone, camera, screen-share, leave, and host end controls.
- The pre-join screen selects the initial name and devices.

### Captions

- The browser Web Speech API produces final English (`en-US`) speech segments where supported.
- Caption packets are validated and sent through reliable, topic-scoped LiveKit data messages.
- Remote display replaces packet-supplied identity with the authenticated LiveKit participant identity/metadata.
- Final speech segments are asynchronously persisted to PostgreSQL.
- The host-only summary reads up to 2,000 transcript rows and can download text.

### Operations

- The app has liveness and PostgreSQL readiness endpoints.
- Startup applies the committed Prisma migration before starting the standalone Next.js server.
- PostgreSQL has a named volume.
- Redis and LiveKit are included in the Dokploy Compose stack.

## Partial or misleading behavior

- The accessibility sheet changes caption visibility, size, and position for the current React session only.
- Preferred language is displayed but the speech engine remains hard-coded to `en-US`.
- High contrast is displayed but not applied.
- Gesture recognition is displayed but no recognition model or event producer exists.
- Transcript types accept gesture data and the summary can render it, but nothing generates it.
- “Upcoming” means any meeting not marked ended; there is no scheduling workflow.
- Chat works only while connected and is not stored.
- “End for everyone” crosses PostgreSQL and LiveKit without an explicit orchestration state or failure reconciliation job.
- The download page says legacy Vite, backend, and Electron systems exist under `archive/`, but that directory is absent from the tracked working tree.
- Package metadata claims sign-language recognition and live translation although neither capability is implemented.
- The historical migration commit claims Google and GitHub OAuth, but the current Better Auth configuration has no social providers.

## Absent baseline capabilities

- Password reset, email verification enforcement, account recovery, and social login.
- Host waiting room/admission, meeting lock/passcode, role model, participant removal, and moderation.
- Durable participant/attendance records.
- Scheduling, invitations, calendar integration, reminders, and timezone handling.
- Persisted accessibility preferences.
- Cross-browser/server captions and translation.
- TURN/TLS for restrictive networks.
- Recording, storage, retention policy, or recording consent.
- Structured logs, error tracking, metrics dashboards, alerting, and audit events.
- Automated backup, restore rehearsal, staging, or documented disaster recovery objectives.
- End-to-end account, guest, media, deployment, or migration tests.

## Data model

The database contains Better Auth `User`, `Session`, `Account`, and `Verification` models plus `Meeting` and `Transcript`.

Known limitations:

- Meeting status is an unconstrained string rather than a database enum.
- `startsAt` exists without a true scheduler.
- Transcript rows store a JSON string rather than typed, indexed columns.
- There are no attendee, membership, invitation, room policy, message, recording, preference, audit, or outbox records.
- Meeting and transcript query indexes are missing.
- Only one initial migration exists; it assumes a fresh database and has no adoption path for a legacy schema.
- Referential deletion/retention behavior for meetings and transcripts is not an explicit product policy.

## Dependency and toolchain truth

- Next.js and React belong together.
- Vite is test tooling only through Vitest. There is no Vite build or dev script.
- `auth@1.7.2` is an unused direct development dependency and should be removed after verification.
- `autoprefixer` appears unused under the Tailwind CSS 4 PostCSS configuration and should be verified before removal.
- `src/features/room/room.service.ts` is an unused compatibility wrapper around the LiveKit adapter.
- `NEXT_PUBLIC_API_URL`, `public/_redirects`, Vercel configuration, archived Vite references, and stale TypeScript exclusions are migration residue.
- Two `picomatch` major lines are legitimate transitive dependencies: 2.3.2 through Next ESLint tooling and 4.0.7 through newer glob/test tooling. The failure was lock-tree integrity/platform generation, not an application importing two incompatible runtime copies.

## Deployment truth

The Compose design is appropriate for a single VPS baseline, but it is not fully production-ready:

- The Dockerfile uses `npm install` in both dependency and runtime stages as a temporary escape from Linux `npm ci` lock validation. This sacrifices deterministic builds.
- GitHub CI still uses `npm ci`, so deployment and CI intentionally use different dependency resolution paths.
- The runner installs production dependencies again even though a standalone Next.js bundle is copied, increasing size, time, and divergence risk; Prisma migrations are the reason the CLI remains available at runtime.
- The app waits for PostgreSQL health but only for LiveKit process start.
- App readiness checks PostgreSQL only.
- LiveKit configuration exists both inline in Compose and in `deploy/livekit.yaml`.
- Redis is intentionally ephemeral and PostgreSQL is persistent, but backup automation is absent.
- No resource limits, log rotation policy, image-digest pinning, staging topology, or rollout strategy is encoded.
- LiveKit signaling can use Dokploy HTTPS, but TCP 7881 and UDP 7882 must be opened directly on the VPS/provider firewall.
- TURN/TLS is not configured, so some corporate or UDP-restricted users will fail to connect.

## Current conclusion

The repository is recoverable. Its core choices—Next.js, PostgreSQL, Better Auth, Prisma, and LiveKit—are compatible. The correct next move is disciplined stabilization, not another platform migration. Implementation must follow the ordered gates in [`DELIVERY_PLAN.md`](./DELIVERY_PLAN.md).
