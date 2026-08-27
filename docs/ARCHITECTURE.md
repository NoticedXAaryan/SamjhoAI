# Architecture

> This is the short architecture guide. For the evidence-backed audit, target state, and known contradictions, use [`engineering/CURRENT_STATE.md`](./engineering/CURRENT_STATE.md) and [`engineering/TARGET_ARCHITECTURE.md`](./engineering/TARGET_ARCHITECTURE.md).

SamjhoAI is a self-hosted modular monolith. One Next.js deployment owns the browser UI, API routes, server actions, authentication integration, meeting domain logic, and persistence. LiveKit is a separate realtime media service; PostgreSQL is the durable source of truth; Redis coordinates LiveKit nodes.

## Runtime topology

```text
Browser
  |-- HTTPS --> Next.js app --> Better Auth / Prisma --> PostgreSQL
  |                  |
  |                  `-- LiveKit server SDK --> LiveKit API
  |
  `-- WSS + WebRTC --------------------------> LiveKit --> Redis
```

The Next.js reverse proxy handles HTTP concerns. LiveKit signaling can use the HTTPS proxy, but media uses directly exposed TCP/UDP ports.

## Source boundaries

- `src/app`: delivery adapters—pages, layouts, API routes, and health endpoints.
- `src/features`: product modules such as authentication, meetings, room UI, and captions.
- `src/infrastructure`: provider implementations such as the server-side LiveKit gateway.
- `src/lib`: application-wide clients for Prisma and Better Auth.
- `src/shared`: provider-neutral validation, browser hooks, small types, and utilities.
- `prisma`: schema and forward-only production migrations.
- `deploy`: LiveKit configuration and self-hosting runbook.

New provider SDK calls belong in `src/infrastructure`, not UI components or domain services. Routes validate and translate transport input; services enforce business rules; repositories own persistence.

## Authenticated host flow

1. Better Auth resolves the HttpOnly account session.
2. A server action validates the meeting title and creates a PostgreSQL meeting owned by that user.
3. The meeting page performs a device pre-join check.
4. The token API verifies the meeting, derives host permissions, and asks the LiveKit gateway for a scoped token.
5. Ending a meeting first closes it in PostgreSQL, preventing new joins, then deletes the LiveKit room to disconnect current participants.

## Guest flow

1. `/meeting/{roomName}` is public; dashboards and summaries are protected.
2. The guest supplies a validated display name on the pre-join screen.
3. The token API verifies that the meeting exists and is not ended.
4. The server creates a signed, room-scoped, 12-hour HttpOnly guest session.
5. LiveKit receives a unique guest identity with non-host grants.
6. Caption persistence accepts the authenticated account or the signed guest identity for that same room.

Guests do not receive database `User` rows and cannot create meetings, end meetings, view history, or open summaries.

## Caption flow

Browser speech recognition produces final caption segments. The client validates and broadcasts versioned, topic-scoped LiveKit data messages for realtime display. Persistence runs asynchronously through a server action, which overwrites client-supplied identity with the verified account or guest identity. Transcript access is host-only.

## Deployment invariants

- `BETTER_AUTH_URL` must equal the public application origin.
- `NEXT_PUBLIC_LIVEKIT_URL` is embedded during the image build.
- `LIVEKIT_URL` is the server-side administrative endpoint.
- PostgreSQL and Redis are never publicly exposed.
- LiveKit media ports bypass the HTTP reverse proxy.
- Production startup applies `prisma migrate deploy` before accepting traffic.
