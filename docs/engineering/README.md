# Engineering record

This directory is the durable handoff for Samjho AI. It exists so that a principal engineer, contributor, or AI agent can understand the project without reconstructing months of decisions from Git history and deployment logs.

## Snapshot

- Audit date: 2026-08-27
- Audited commit: `3ff3d67` (`master`, synchronized with `origin/master` when audited)
- Product runtime: Next.js 16 modular monolith on Node.js 22
- Media plane: self-hosted LiveKit with Redis
- Identity: Better Auth with PostgreSQL
- Deployment target: Dokploy Compose
- UI constraint: preserve the current product design unless a separately approved task changes it
- Current verdict: locally buildable and Compose-resolvable, but not yet proven production-ready

The working tree contained user-owned brand and metadata edits during this audit. They were intentionally not modified. See [`AI_HANDOFF.md`](./AI_HANDOFF.md) before editing.

## Documents

- [`CURRENT_STATE.md`](./CURRENT_STATE.md): evidence-backed inventory and system truth.
- [`ISSUE_REGISTER.md`](./ISSUE_REGISTER.md): prioritized risks and gaps with completion criteria.
- [`TARGET_ARCHITECTURE.md`](./TARGET_ARCHITECTURE.md): recommended architecture and explicit non-goals.
- [`DELIVERY_PLAN.md`](./DELIVERY_PLAN.md): executable phases, gates, and definition of done.
- [`INCIDENT_HISTORY.md`](./INCIDENT_HISTORY.md): migration and deployment failure history.
- [`AI_HANDOFF.md`](./AI_HANDOFF.md): safe resumption guide.

## Documentation operating model

For every material change:

1. Update the audit date and verified facts in `CURRENT_STATE.md`.
2. Add, revise, or close the corresponding issue in `ISSUE_REGISTER.md`.
3. Record irreversible or expensive-to-reverse choices as an ADR.
4. Update the relevant runbook and tests.
5. Add the verification evidence: command, environment, result, and date.
6. If a deployment incident occurred, append it to `INCIDENT_HISTORY.md` rather than rewriting history.

Issue statuses are `open`, `in progress`, `blocked`, `verified`, or `superseded`. An issue is not `verified` merely because code was written; its acceptance criteria must have been demonstrated in the environment named by the issue.

## Vocabulary

- **Application plane:** Next.js pages, API routes, server actions, auth integration, domain services, and Prisma access.
- **Media plane:** LiveKit signaling, WebRTC media, data messages, and Redis coordination.
- **Account participant:** a user authenticated by Better Auth.
- **Guest participant:** a participant admitted by meeting link and a signed, room-scoped guest credential, without a database `User` record.
- **Baseline:** the smallest dependable Google Meet alternative: account host, guest join, audio/video, screen sharing, chat, captions, host lifecycle controls, security, recovery, and operational proof.
- **Production-ready:** repeatable build and deploy, tested recovery, observable failures, documented data handling, and verified real-world media connectivity.
