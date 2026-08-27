# Engineering issue register

Priority meanings:

- **P0:** blocks a trustworthy deployment or can cause severe loss/outage.
- **P1:** required for the dependable meeting baseline.
- **P2:** required before a broad production launch.
- **P3:** product expansion after the baseline is stable.

## P0 — deployment and release integrity

### REL-001 — Latest public deployment is not verified

- Status: open
- Evidence: the last supplied container log predates or exhibits the standalone-runtime fix; local Compose parsing is not a public deployment test.
- Risk: the repository can appear fixed while Dokploy routing or runtime still returns Bad Gateway.
- Required result: deploy commit `3ff3d67` or later, prove both health endpoints, sign-in, guest join, two-browser audio/video, screen share, caption persistence, and host end.

### REL-002 — Dependency installation is non-deterministic

- Status: open; temporary workaround active
- Evidence: Docker uses `npm install`; CI uses `npm ci`; prior Linux builds rejected the Windows-generated lock tree with `picomatch` and missing-package errors.
- Risk: the same commit can resolve different transitive versions at different times or between build stages.
- Required result: generate and verify the lockfile in the exact Linux/Node/npm environment used by Docker, restore `npm ci` in all stages, and add a clean Docker build gate.

### REL-003 — CI and deployment do not exercise the same artifact

- Status: open
- Evidence: CI runs host-level npm commands but does not build the Docker image or start Compose.
- Risk: CI green does not predict Dokploy success.
- Required result: CI builds the exact production image; a smoke stage starts PostgreSQL and the app, runs migrations, and probes liveness/readiness.

### REL-004 — Build succeeds despite invalid auth configuration

- Status: open
- Evidence: local `next build` emitted default-secret and missing-base-URL Better Auth errors but exited zero.
- Risk: a green build can produce a broken runtime.
- Required result: one centralized environment schema fails early for missing/invalid production variables; build tests assert both valid and invalid configurations.

### REL-005 — Database adoption and rollback strategy is absent

- Status: open
- Evidence: a single initial migration assumes a fresh database; historical schemas used different auth models.
- Risk: data loss, failed migrations, or an unrecoverable upgrade.
- Required result: declare fresh-database-only for the first production launch or write a rehearsed legacy migration; document backup, restore, forward repair, and schema compatibility.

### OPS-001 — Backups are instructions, not an implemented system

- Status: open
- Evidence: PostgreSQL has a volume but no scheduled encrypted off-host backup or restore test.
- Risk: VPS or volume loss permanently deletes accounts, meetings, and transcripts.
- Required result: automated backups, retention, encryption, off-host storage, monitoring, and a dated restore rehearsal.

### MEDIA-001 — Public media traversal is not proven

- Status: open
- Evidence: Compose exposes TCP 7881 and UDP 7882, but there is no recorded external connectivity test or TURN/TLS setup.
- Risk: the page loads while calls fail for NAT, firewall, mobile, or corporate users.
- Required result: two-network browser test, firewall proof, LiveKit connectivity diagnostics, and TURN/TLS before claiming broad reliability.

## P1 — dependable meeting baseline

### AUTH-001 — Account recovery is missing

- Status: open
- Gap: no password reset, email verification workflow, or verified recovery path.
- Required result: rate-limited reset flow, expiring single-use tokens, enumeration-safe responses, and end-to-end tests.

### AUTH-002 — Guest admission is link possession only

- Status: open
- Gap: any holder of a valid link can activate and enter the meeting, including before the host.
- Required result: explicit room policy supporting at least host-first admission, waiting room, lock, and optional passcode.

### AUTH-003 — One global guest cookie breaks concurrent rooms

- Status: open
- Evidence: the single `samjho_guest` cookie is overwritten when a guest joins another room.
- Risk: multiple tabs/rooms can lose caption authorization or inherit confusing guest state.
- Required result: room-keyed credentials or a server-side guest session model with multi-room and revocation tests.

### AUTH-004 — Proxy rate limiting is process-local and proxy-trust-sensitive

- Status: open
- Evidence: an in-memory map keys requests from the first `x-forwarded-for` value.
- Risk: restart/replica bypass, inconsistent limits, or spoofed client identity if proxy trust is misconfigured.
- Required result: shared Redis limiter, explicit trusted-proxy rules, endpoint-specific budgets, and observability.

### MEET-001 — Meeting state is weakly modeled

- Status: open
- Evidence: status is a free string; first join changes scheduled to active; no explicit lifecycle or transition concurrency rules.
- Required result: typed database state, transition service, host-start policy, idempotency, and concurrency tests.

### MEET-002 — Roles and moderation are missing

- Status: open
- Gap: tokens distinguish host only in metadata, while media grants are effectively the same for every participant.
- Required result: authoritative host/co-host/participant roles; admit, remove, lock, mute-request, screen-share policy, and authorization tests.

### MEET-003 — End-meeting crosses systems without reconciliation

- Status: open
- Evidence: PostgreSQL is marked ended before the LiveKit delete call; failures are surfaced but not recorded for retry.
- Required result: idempotent orchestration state/outbox, retryable room closure, and tests for each partial-failure ordering.

### MEET-004 — Reconnect identity is unstable

- Status: open
- Evidence: every token appends a random UUID to the LiveKit identity.
- Risk: refresh/rejoin can create duplicates and makes attendance/moderation identity difficult.
- Required result: documented connection identity strategy, stale-session eviction, and reconnect tests.

### MEET-005 — Scheduling is represented but not implemented

- Status: open
- Evidence: `startsAt` and scheduled status exist, but creation always starts now and there are no invitations or timezones.
- Required result: either remove scheduling semantics for baseline honesty or implement scheduling, edit/cancel, timezone, invitation, and reminder behavior.

### DATA-001 — Participant and attendance records are absent

- Status: open
- Required result: meeting membership/session records for account and guest participants, join/leave timestamps, role, and moderation audit references.

### CAP-001 — Caption language setting is disconnected

- Status: open
- Evidence: preferences offer six languages; recognition and packets are always `en-US`.
- Required result: connect supported locale selection, show browser support/failure, and test language propagation.

### CAP-002 — Caption persistence is best-effort and invisible on failure

- Status: open
- Evidence: each final phrase invokes a server action and catches failures silently.
- Risk: users believe a transcript is saved when it is incomplete.
- Required result: batching/queueing, delivery acknowledgement, retry/backpressure, visible transcript health, and loss tests.

### CAP-003 — Transcript storage is an untyped JSON string

- Status: open
- Risk: weak querying, validation drift, hard migrations, and inefficient exports.
- Required result: typed columns for speaker, type, content, language, confidence, source time, sequence, and indexes; retain raw provider data only if necessary.

### ACC-001 — Accessibility preferences are cosmetic session state

- Status: open
- Evidence: high contrast and gesture toggles have no effect; all preferences reset on reload.
- Required result: remove false controls or implement and persist them; keyboard/screen-reader behavior must be tested.

### UX-001 — Critical failures are hidden

- Status: open
- Evidence: dashboard data errors become an empty state; caption storage failures are swallowed.
- Required result: explicit error, retry, offline/reconnecting, and degraded-service states without redesigning the visual language.

## P2 — launch hardening

### ARCH-001 — Module dependency rules contradict the code

- Status: open
- Evidence: feature-to-feature and shared-to-feature imports violate `src/features/README.md`.
- Required result: define one allowed dependency graph and enforce it with lint boundaries; move cross-cutting contracts to a neutral application/shared layer.

### ARCH-002 — Migration residue creates multiple sources of truth

- Status: open
- Evidence: unused `auth` dependency, likely unused `autoprefixer`, obsolete `NEXT_PUBLIC_API_URL`, Netlify `_redirects`, Vercel config, missing `archive/` references, stale TypeScript exclusions, duplicate LiveKit config, and an unused room service wrapper.
- Required result: evidence-backed deletion, one deployment target, one LiveKit config source, and corrected product/package text.

### ARCH-003 — Environment configuration is duplicated and weakly typed

- Status: open
- Required result: centralized server/client environment schemas, canonical variable reference, compile-time public/private separation, and generated/example synchronization tests.

### SEC-001 — Browser security policy is incomplete

- Status: open
- Evidence: defensive headers exist, but no tested Content Security Policy is set.
- Required result: nonce/hash-compatible CSP covering Next.js and LiveKit, plus automated header tests.

### SEC-002 — Abuse, privacy, and retention policies are undefined

- Status: open
- Required result: transcript retention/deletion, account deletion, meeting-link exposure response, recording consent, acceptable use, privacy notice, and audit policy.

### SEC-003 — Dependency and image vulnerability management is absent

- Status: open
- Required result: automated dependency/image scanning, triage SLA, digest/version update policy, and SBOM/provenance decision.

### TEST-001 — Automated coverage excludes the riskiest paths

- Status: open
- Evidence: 39.26% statements in a narrow include set; actions, room service, speech hook, UI flows, auth routes, token route, migrations, and Docker runtime lack meaningful coverage.
- Required result: risk-based unit/integration coverage and removal of the 25% blanket threshold as a success proxy.

### TEST-002 — No end-to-end realtime test environment

- Status: open
- Required result: browser tests for account host plus guest, token issuance, pre-join, chat/data, end/disconnect, summaries, and selected media smoke scenarios.

### OBS-001 — Failures cannot be operated from evidence

- Status: open
- Gap: no structured logs, request/correlation IDs, error tracker, service-level metrics, dashboards, or alerts.
- Required result: privacy-safe logs and metrics for auth, token issuance, joins, LiveKit RPCs, caption persistence, migrations, health, and database saturation.

### OPS-002 — Readiness only checks PostgreSQL

- Status: open
- Risk: the app is healthy to the proxy while all meetings are unusable.
- Required result: separate dependency/readiness signals for database and LiveKit, with clear semantics that do not flap the app during transient media issues.

### OPS-003 — Capacity and resource boundaries are unknown

- Status: open
- Required result: container CPU/memory limits, connection limits, file descriptors, database pool sizing, Redis/LiveKit sizing, load targets, and a measured capacity report.

### OPS-004 — Release, staging, rollback, and incident ownership are informal

- Status: open
- Required result: staging or ephemeral verification environment, immutable image identifier, migration gate, smoke checks, rollback/forward-fix procedure, owners, and incident severity definitions.

## P3 — product expansion after baseline

### PROD-001 — Persistent chat and searchable meeting artifacts

- Required result: choose retention and access model before storing messages; add search/export only after authorization and privacy controls exist.

### PROD-002 — Recording

- Required result: LiveKit Egress or equivalent, object storage, consent indicator, quotas, retention, download authorization, and deletion.

### PROD-003 — Translation and server-grade captions

- Required result: provider-neutral transcription/translation interface, consent and cost controls, language quality metrics, latency targets, and graceful browser-caption fallback.

### PROD-004 — Sign-language recognition

- Required result: a separately reviewed ML product plan covering datasets, consent, supported signs/languages, evaluation, false-result UX, on-device/server inference, performance, and accessibility-community validation. Until then, remove implementation claims from metadata and product copy.

### PROD-005 — Calendar, invitations, notifications, and reminders

- Required result: stable meeting lifecycle and verified email delivery precede external calendar integrations.

### PROD-006 — Multi-node scale and regional resilience

- Required result: only after measured single-node limits; introduce shared rate limiting, Redis durability decision, LiveKit topology, database strategy, and traffic/routing plan from evidence.
