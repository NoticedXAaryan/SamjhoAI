# Testing strategy

> This describes the current test commands. It does not certify production readiness; verified coverage and missing test layers are recorded in [`engineering/CURRENT_STATE.md`](./engineering/CURRENT_STATE.md) and issues `TEST-001`/`TEST-002`.

## Automated gate

`npm run check` runs lint, TypeScript, Vitest, and the production Next.js build. CI runs the same categories on Node.js 22.

Current automated coverage includes meeting service rules, Prisma repository mappings, caption persistence mappings, validation schemas, and signed guest-session tamper/expiry/room isolation.

## Required manual meeting smoke test

Run this against the public deployment, because localhost cannot verify public NAT, TLS, TURN, or firewall behavior.

1. Register or sign in and create a meeting.
2. Open the link in an incognito browser without signing in.
3. Join with a display name and select camera/microphone devices.
4. Confirm both participants see and hear each other.
5. Toggle microphone and camera from both browsers.
6. Share a screen and confirm the remote browser receives it.
7. Send chat messages in both directions.
8. Start speech captions from the host and guest; confirm remote display and persistence.
9. Leave as a guest and confirm the browser returns to the public landing page.
10. Rejoin, then end as host; confirm both clients disconnect.
11. Confirm the host can download the transcript and an unauthenticated browser is redirected from the summary.

## Deployment checks

- `docker compose config` must resolve without missing variables.
- The production image must build from `docker-compose.yml` when a Docker engine is available.
- `/health/live` returns 200 when the Next.js process is running.
- `/health/ready` returns 200 only when PostgreSQL is reachable; otherwise it returns 503.
- TCP `7881` and UDP `7882` must be reachable from outside the VPS.
