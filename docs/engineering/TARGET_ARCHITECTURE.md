# Target architecture

## Recommendation

Keep Samjho AI as a Next.js modular monolith with PostgreSQL and Better Auth for the application plane, and keep LiveKit as the self-hosted SFU/media plane. Deploy the stack through Dokploy on one VPS for the baseline. Do not replace LiveKit with hand-written peer-to-peer WebRTC, Socket.IO signaling, or a custom mediasoup stack while the product is still establishing basic reliability.

This choice minimizes operational and implementation surface while preserving a path to larger rooms, TURN, recording, and multi-node media later.

## What stays

- The current visual system and user-facing layout.
- Next.js App Router and React.
- TypeScript, Tailwind CSS, and the existing component library.
- Better Auth with PostgreSQL-backed sessions.
- Prisma as the data access and migration tool.
- LiveKit client/server SDKs and self-hosted LiveKit.
- Docker Compose as the Dokploy deployment unit for the first production stage.

## What is explicitly not needed

- A second Vite frontend.
- A separate Express API for the baseline.
- Multiple repositories.
- Microservices for auth, meetings, captions, and transcripts.
- A custom WebRTC signaling/media implementation.
- Kubernetes.
- A mandatory paid SaaS conferencing API.

## Target runtime

```text
Public domains
  samjhoai.aaaryan.space
    -> Dokploy TLS/router -> app:3000

  livekit.samjhoai.aaaryan.space
    -> Dokploy TLS/router -> livekit:7880 (HTTP/WebSocket signaling)

Public media ports
  VPS:7881/tcp -> livekit:7881
  VPS:7882/udp -> livekit:7882
  TURN/TLS domain/port -> LiveKit TURN configuration before broad launch

Private Compose network
  app -> postgres:5432
  app -> livekit:7880 for administrative RPC
  livekit -> redis:6379
```

For self-hosting, set the browser URL to the public `wss://livekit...` endpoint and the server administrative URL to the private `http://livekit:7880` endpoint. Secrets stay server-side.

## Target source boundaries

Use one directional dependency rule:

```text
src/app (delivery)
  -> src/features/*/application (use cases)
      -> src/features/*/domain (types and rules)
          <- ports/interfaces
      -> src/infrastructure (Prisma, LiveKit, mail, queues)

src/components/ui and src/shared
  contain provider-neutral presentation primitives and contracts only
```

Practical rules:

- Routes and server actions authenticate, validate transport input, invoke one use case, and translate errors.
- Domain/application code does not import Next.js, Prisma, LiveKit, or React.
- Provider code implements interfaces owned by the application/domain boundary.
- React room components use client-safe application adapters, not repositories.
- Cross-feature contracts such as participant identity and caption packets live in a neutral `src/contracts` or `src/shared/contracts` area.
- Enforce these rules with lint import boundaries.

Do not perform a folder rewrite all at once. Move code only when implementing a tested use case.

## Identity and admission model

### Accounts

- Better Auth remains the session authority.
- Add verified recovery and optional email verification before broad launch.
- OAuth is optional and should be added only with explicit provider configuration and account-linking tests.

### Guests

- Guests can join without creating an account.
- A guest identity is not a fake `User` record.
- Replace the single global guest cookie with room-keyed or server-side guest sessions.
- Admission policy belongs to the meeting: open, host-first/waiting-room, passcode, and locked.
- LiveKit tokens are issued only after the application authorizes admission.
- Token grants and room actions derive from authoritative roles, not client metadata.

## Meeting domain

Model an explicit lifecycle such as:

```text
draft/scheduled -> open -> active -> ending -> ended
                         \-> cancelled
```

The exact enum can be simpler for the baseline, but transitions must be centralized, idempotent, and tested. A guest token request must not implicitly decide business state unless the selected admission policy permits it.

Recommended records:

- `Meeting`: owner, title, scheduled/start/end times, status, admission policy, passcode hash if enabled, version.
- `MeetingMember` or `MeetingRole`: user/guest subject, role, admission state.
- `AttendanceSession`: connection identity, join/leave times, client/session metadata permitted by privacy policy.
- `TranscriptSegment`: typed content, speaker subject, source timestamp, sequence, language, confidence, kind.
- `MeetingEvent` or outbox: durable lifecycle/moderation events and retryable provider actions.
- `UserPreference`: validated accessibility settings.
- Later only: messages, recordings, invitations, notification deliveries.

Add indexes from actual query patterns and define deletion/retention behavior before storing more personal data.

## LiveKit decision

LiveKit is the right current choice because it already supplies the hardest media functions: an SFU, reconnection behavior, device tracks, screen share, data channels, server-issued room tokens, room administration, TURN support, and an egress path.

Alternatives were considered conceptually:

- Direct browser peer-to-peer is simpler only for tiny rooms and pushes mesh scaling, signaling, NAT traversal, moderation, and reconnection back into this project.
- mediasoup provides control but requires the team to build more signaling, lifecycle, deployment, and client integration.
- Jitsi is a larger integrated conferencing product and would fight the current custom UI/product model.
- A managed conferencing API reduces operations but conflicts with the stated self-hosting preference and introduces recurring dependency/cost.

LiveKit should remain behind an internal gateway interface so Cloud or another provider can be adopted later without exposing SDK calls throughout the codebase.

## Caption and accessibility architecture

Split captions into four responsibilities:

1. Capture provider: browser Web Speech initially; optional server provider later.
2. Normalization: one validated caption contract with server-authoritative speaker identity.
3. Realtime delivery: LiveKit data for low latency, with sequence/deduplication semantics.
4. Durable delivery: batched/retryable persistence with visible health.

Accessibility preferences must be real behavior, not switches disconnected from the product. Persist account preferences; keep guest preferences locally when appropriate. Every preference requires keyboard, screen-reader, contrast, and cross-browser acceptance tests.

Do not call transcript rendering an AI summary unless an actual summarization system exists and has privacy/cost/failure behavior documented.

## Deployment and release architecture

- One canonical Compose file for Dokploy.
- One canonical LiveKit configuration source.
- A Linux-generated, committed npm lockfile used with `npm ci` everywhere.
- CI builds the same Docker image that Dokploy runs.
- Production image is identified by Git SHA or immutable digest.
- Migration execution is explicit, serialized, observable, and precedes compatible app rollout.
- Health is separated into process liveness, database readiness, and media dependency diagnostics.
- PostgreSQL backup is automated and restored on a schedule.
- Resource limits and logging policy are encoded.
- A staging or ephemeral environment runs account/guest and media smoke tests before production.

CI should help deployment rather than hold it hostage. Use layered gates:

- Fast required gate: install integrity, typecheck, focused tests, production image build.
- Integration gate: database migration, auth, token, and lifecycle tests.
- Deployment smoke: health and a minimal public flow.
- Broader quality/security scans can begin advisory and become required only after they are stable and actionable.

## Observability and reliability

Capture privacy-safe structured events for request ID, deployment revision, auth outcome, meeting lifecycle, token issuance, LiveKit admin RPC, join/disconnect reason, caption persistence, migration, and dependency health. Never log passwords, tokens, cookies, transcript content, or private meeting links.

Define initial service objectives before optimization:

- HTTP availability and error rate.
- token issuance success/latency.
- room join success/time.
- unexpected disconnect rate.
- caption persistence success/lag.
- database backup success and restore time.

Measure a single node before designing multi-node scale.
