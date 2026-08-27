# Delivery plan

This is the required execution order. Later phases must not distract from an unverified deployment or broken meeting baseline.

## Phase 0 — freeze the truth and protect the UI

Goal: stop architecture churn and make every change reviewable.

Work:

- Adopt `docs/` as the documentation entry point and this engineering record as the source of truth.
- Preserve the current UI and user-owned brand/metadata changes.
- Choose owners for application, media, data, security, release, and product acceptance—even if one person fills several roles.
- Convert decisions 0001–0004 from proposed to accepted or revise them before structural implementation.
- Label stale root roadmaps and migration-era files as historical; do not implement from them.
- Require issue IDs and verification evidence in meaningful changes.

Exit gate:

- No active document claims unimplemented functionality is implemented.
- The exact deployment commit and dirty user files are recorded.
- Every engineer/agent begins with `docs/engineering/AI_HANDOFF.md`.

## Phase 1 — deterministic Dokploy deployment

Goal: the same commit builds and starts the same way locally, in CI, and in Dokploy.

Work:

1. Create a clean Linux Node 22/npm 10 dependency environment.
2. Regenerate and inspect `package-lock.json` there.
3. Remove confirmed unused direct dependencies and resolve peer/version mismatches.
4. Restore `npm ci` in dependency and runtime build paths.
5. Simplify the standalone image while retaining an intentional Prisma migration mechanism.
6. Add centralized environment validation and fail invalid production configuration before serving.
7. Make CI build the production Docker image; remove duplicate host-only signals that add no confidence.
8. Add a database-backed container smoke test that runs the committed migration and probes health.
9. Select one LiveKit config source and one deployment target; remove Vercel/Netlify/archive residue after evidence review.
10. Add image revision metadata, health semantics, log rotation, and resource limits.
11. Verify Dokploy routes `samjhoai.aaaryan.space` to app port 3000 and the LiveKit subdomain to port 7880 with WebSocket support.
12. Verify VPS and provider firewalls expose LiveKit media ports correctly.
13. Record the complete environment variable set without committing secrets.

Exit gate:

- A clean Linux `npm ci` succeeds.
- CI builds the exact production image.
- Dokploy deploys a Git-SHA-identifiable image.
- Liveness and readiness pass publicly.
- Two browsers on different networks exchange audio/video and screen share.
- A deployment rollback has been demonstrated once.

## Phase 2 — dependable Google Meet baseline

Goal: hosts and guests can reliably complete a real meeting.

Work:

1. Define the meeting state machine and admission modes.
2. Add room-keyed guest sessions and concurrent-room tests.
3. Add waiting room/host-first admission, lock, and optional passcode.
4. Add authoritative roles and token grants.
5. Add host moderation: admit/deny, remove participant, and screen-share policy; use mute requests rather than pretending to control browser hardware.
6. Make end-meeting orchestration idempotent and reconcile failed LiveKit deletion.
7. Stabilize reconnect identities and duplicate-session behavior.
8. Add attendee/session records and audit events.
9. Implement password reset and verified account recovery.
10. Decide whether baseline meetings are immediate-only. If yes, remove misleading schedule semantics; if no, implement schedule/edit/cancel/timezone behavior.
11. Add visible error/retry states for dashboard loading, token issuance, media failure, and end-meeting failure while keeping the UI design intact.
12. Add device switching and permission recovery after join.
13. Add browser-level host-and-guest tests plus a real-network media smoke suite.

Exit gate:

- A guest joins without an account only under the configured admission policy.
- Unauthorized users cannot exercise host actions.
- Reconnect, duplicate tabs, host leave, host end, and dependency failures have defined outcomes.
- The end-to-end baseline passes in supported browsers and on at least two network types.

## Phase 3 — data safety, security, and privacy

Goal: protect user data and make failures recoverable.

Work:

1. Implement encrypted off-host PostgreSQL backups and retention.
2. Rehearse restore into an isolated environment and record recovery time/data loss.
3. Convert meeting status and transcript storage to typed, indexed schema with forward migrations.
4. Define transcript/account deletion and retention.
5. Add centralized Redis rate limiting and trusted-proxy configuration.
6. Add a tested Content Security Policy and automated security-header checks.
7. Add dependency, container image, secret, and migration scanning with actionable policies.
8. Add audit logging for auth, admission, moderation, lifecycle, and data access without logging sensitive content.
9. Threat-model account takeover, meeting-link leakage, guest abuse, token replay, transcript access, CSRF/XSS, denial of service, and malicious realtime packets.
10. Publish privacy, recording consent, acceptable-use, and security reporting policies before collecting more content.

Exit gate:

- Restore rehearsal succeeds.
- Critical authorization paths have negative tests.
- No known P0/P1 security finding remains open.
- Data retention and deletion are implemented and documented.

## Phase 4 — captions and accessibility completion

Goal: make accessibility functionality dependable and honest.

Work:

1. Connect supported language preferences to speech recognition.
2. Detect unsupported browsers and provide clear fallback guidance.
3. Batch, acknowledge, retry, and monitor transcript persistence.
4. Preserve caption ordering and deduplicate reconnect/retry deliveries.
5. Persist account preferences and retain sensible guest-local preferences.
6. Implement high contrast and all visible accessibility settings or remove nonfunctional controls.
7. Test keyboard navigation, focus, labels, screen readers, zoom, reduced motion, contrast, caption layout, and mobile behavior.
8. Evaluate server transcription only after privacy, latency, cost, and fallback requirements are defined.
9. Evaluate translation only after transcription is reliable.
10. Treat sign-language recognition as a separate ML program with representative data, measured accuracy, and community validation; do not ship a decorative detector.

Exit gate:

- Every visible accessibility control changes real behavior.
- Caption storage health is visible and loss behavior is tested.
- Supported languages/browsers are documented from measured behavior.
- Product and package claims match implemented capabilities.

## Phase 5 — operations and launch readiness

Goal: run the product without debugging blind.

Work:

1. Add structured logs and correlation/deployment IDs.
2. Instrument auth, HTTP, database, token, room, disconnect, and caption metrics.
3. Add actionable dashboards and alerts with runbook links.
4. Define SLOs and incident severities.
5. Load-test app, PostgreSQL, Redis, and LiveKit; document room/participant limits.
6. Tune connection pools, file descriptors, CPU/memory, bandwidth, and storage alerts.
7. Add TURN/TLS and validate restrictive-network connectivity.
8. Establish staging, promotion, rollback, maintenance, and dependency upgrade procedures.
9. Run accessibility, security, privacy, backup, and disaster-recovery launch reviews.
10. Execute a full release candidate test and freeze the verified evidence.

Exit gate:

- Operators can detect, diagnose, and recover representative failures using dashboards and runbooks.
- Capacity and recovery objectives are measured.
- The release candidate passes the production checklist without manual code changes.

## Phase 6 — post-baseline product expansion

Only after phases 1–5:

- Persistent chat and artifact search.
- Recording with LiveKit Egress and object storage.
- Calendar integrations, email invitations, and reminders.
- Server transcription and translation.
- Carefully validated sign-language recognition.
- Co-host/interpreter workflows.
- Admin/support tooling.
- Multi-node application and LiveKit scaling based on measured need.

## Definition of done for every item

An item is complete only when:

- behavior and failure cases are specified;
- implementation follows the accepted boundary rules;
- authorization and input validation are tested;
- unit/integration/browser tests are proportionate to risk;
- deployment and migration impact are handled;
- observability exists for material runtime failures;
- documentation and runbooks are updated;
- acceptance criteria are demonstrated in the named environment;
- no unrelated UI or user-owned work is overwritten.
