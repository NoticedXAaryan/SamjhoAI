# Operations runbook

> This is the current manual runbook. Unimplemented operational controls and their acceptance criteria are maintained in [`engineering/ISSUE_REGISTER.md`](./engineering/ISSUE_REGISTER.md).

## Health

- `/health/live`: the Next.js process can answer HTTP.
- `/health/ready`: PostgreSQL responds to `SELECT 1`; returns 503 otherwise.
- LiveKit metrics are available internally on port `6789` when an observability system is attached.

Readiness deliberately does not pretend the media path is healthy. Validate LiveKit signaling and media separately with the two-browser smoke test.

## Backups

PostgreSQL is the durable source of truth. Back it up on a schedule appropriate to transcript and account retention requirements, encrypt backups, store them outside the VPS, and rehearse restoration. Redis is ephemeral coordination state and is not a database backup target.

Before migrations or major upgrades, take a database backup and record the running application, PostgreSQL, Redis, and LiveKit image versions.

## Deploy and rollback

1. Run `npm run check` and build the Docker image.
2. Review Prisma migrations for destructive statements.
3. Back up PostgreSQL.
4. Deploy immutable image tags; avoid `latest` for production services.
5. Check liveness, readiness, authentication, guest join, and two-browser media.
6. If application code fails, roll back the application image. Do not automatically reverse a database migration; restore or apply a tested forward repair.

## Incident triage

- App unavailable: inspect app logs, `/health/live`, container state, and reverse-proxy routing.
- Ready endpoint 503: inspect PostgreSQL health, credentials, storage, connections, and migration status.
- Sign-in redirects fail: verify `BETTER_AUTH_URL`, proxy headers, cookies, and system clock.
- Meeting page loads but media fails: verify LiveKit WSS routing, public IP discovery, TCP `7881`, UDP `7882`, browser permissions, and host/provider firewalls.
- Some corporate users cannot connect: deploy and validate TURN/TLS; do not route UDP through the HTTP proxy.
- Guests cannot persist captions: verify the guest cookie is present, not expired, signed with the current secret, and scoped to the same room.

## Upgrades

Update one infrastructure component at a time. Read release notes, pin the new image or package version, run the automated gate, deploy to staging, perform the full meeting smoke test, and only then promote to production.
