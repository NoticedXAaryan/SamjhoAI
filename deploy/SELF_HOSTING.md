# Self-hosting with Dokploy

Samjho AI has no required paid API dependency. Authentication and application data use PostgreSQL, and realtime media uses the open-source LiveKit server.

## Required secrets and domains

- `POSTGRES_PASSWORD`: strong unique database password.
- `BETTER_AUTH_SECRET`: at least 32 random bytes (for example, `openssl rand -base64 32`).
- `GUEST_SESSION_SECRET`: at least 32 random bytes for signed, room-scoped guest sessions. It may initially match `BETTER_AUTH_SECRET`, but a separate value makes rotation safer.
- `BETTER_AUTH_URL`: public HTTPS application URL, such as `https://meet.example.com`.
- `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`: a unique LiveKit key pair. The secret should be at least 32 characters.
- `NEXT_PUBLIC_LIVEKIT_URL`: public secure WebSocket endpoint, such as `wss://livekit.example.com`.
- `LIVEKIT_URL`: server-side HTTPS endpoint for LiveKit administration, normally `https://livekit.example.com`.

Use `docker-compose.yml` as the Compose file in Dokploy. The stack contains the Next.js app, PostgreSQL, Redis, and a pinned LiveKit server. It joins the public services to Dokploy's external `dokploy-network` and stores the LiveKit configuration as a Compose-managed config, so automatic Git deployments do not depend on repository-relative bind mounts. Route the application domain to the `app` service on port `3000` and the LiveKit domain to the `livekit` service on port `7880` with WebSocket support.

Add every variable listed above to the Dokploy Compose application's **Environment** settings. Repository example files are documentation only and are not loaded automatically by Dokploy. Compose stops immediately with a clear message when a required variable is absent.

## Network requirements

The LiveKit signaling endpoint on `7880` can sit behind Dokploy's HTTPS reverse proxy. WebRTC media ports cannot rely on an HTTP reverse proxy: allow inbound TCP `7881` and UDP `7882` directly to the host. For production networks where UDP is restricted, generate LiveKit's full VM configuration with TURN/TLS and a separate TURN domain.

The checked-in LiveKit configuration is a single-host baseline. It uses Redis and UDP mux port `7882` to remain manageable in a Compose deployment. Set `rtc.node_ip` explicitly in `deploy/livekit.yaml` if automatic public-IP discovery does not work behind NAT. Do not publish Redis or PostgreSQL to the public internet.

Dokploy's HTTP proxy handles application and LiveKit signaling TLS, but it does not carry WebRTC media. Open `7881/tcp` and `7882/udp` in both the VPS firewall and the hosting provider firewall. If users behind restrictive corporate networks must connect, add LiveKit TURN/TLS on a separate domain; the baseline UDP mux is not a full replacement for TURN/TLS.

## Deployment sequence

This recovery replaces the old Clerk-linked `User` shape with Better Auth's self-hosted account tables. Use a fresh PostgreSQL database for the first deployment unless you intentionally write and test a data migration for an existing database. Do not point this build at an old production database and assume the initial migration can adopt it automatically.

1. Configure the variables above in Dokploy before the image build. `NEXT_PUBLIC_LIVEKIT_URL` is embedded in the browser bundle at build time.
2. Deploy the Compose stack. The application container runs `prisma migrate deploy` before starting Next.js.
3. Confirm `https://meet.example.com/health/live` and `/health/ready` return HTTP 200.
4. Create one account, start a meeting, and copy its link into a private/incognito browser. Join from the private browser with only a display name. Verify two-way audio/video, screen sharing, guest captions, participant names, guest leave behavior, and host-only meeting end.
5. End the meeting as the host and confirm the authenticated host can open the transcript while the guest cannot open the protected summary URL.

## Guest access model

Meeting creation, scheduling, history, transcript access, and host controls require an account. A participant with a valid meeting link may join without an account. The token endpoint validates their display name, verifies that the meeting exists and has not ended, creates a signed room-scoped HttpOnly guest session, and issues a restricted LiveKit participant token. Guest sessions expire after 12 hours and cannot authorize access to another room or to meeting summaries.

Back up the `postgres-data` volume. Redis contains LiveKit coordination state and is not the source of truth for accounts or meeting history.
