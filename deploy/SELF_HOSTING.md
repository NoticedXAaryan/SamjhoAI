# Self-hosting with Dokploy

Samjho AI has no required paid API dependency. Authentication and application data use PostgreSQL, and realtime media uses the open-source LiveKit server.

## Required secrets and domains

- `POSTGRES_PASSWORD`: strong unique database password.
- `BETTER_AUTH_SECRET`: at least 32 random bytes (for example, `openssl rand -base64 32`).
- `BETTER_AUTH_URL`: public HTTPS application URL, such as `https://meet.example.com`.
- `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`: a unique LiveKit key pair. The secret should be at least 32 characters.
- `NEXT_PUBLIC_LIVEKIT_URL`: public secure WebSocket endpoint, such as `wss://livekit.example.com`.

Use `compose.self-hosted.yml` as the Compose file in Dokploy. Route the application domain to port `3000` and the LiveKit domain to port `7880` with WebSocket support.

## Network requirements

The LiveKit signaling endpoint on `7880` can sit behind Dokploy's HTTPS reverse proxy. WebRTC media ports cannot rely on an HTTP reverse proxy: allow inbound TCP `7881` and UDP `7882` directly to the host. For production networks where UDP is restricted, generate LiveKit's full VM configuration with TURN/TLS and a separate TURN domain.

The checked-in LiveKit configuration is a single-host baseline. It uses Redis and a UDP mux port to remain manageable in a Compose deployment. Set `rtc.node_ip` explicitly in `deploy/livekit.yaml` if automatic public-IP discovery does not work behind NAT.

## Deployment sequence

This recovery replaces the old Clerk-linked `User` shape with Better Auth's self-hosted account tables. Use a fresh PostgreSQL database for the first deployment unless you intentionally write and test a data migration for an existing database. Do not point this build at an old production database and assume the initial migration can adopt it automatically.

1. Configure the variables above in Dokploy before the image build. `NEXT_PUBLIC_LIVEKIT_URL` is embedded in the browser bundle at build time.
2. Deploy the Compose stack. The application container runs `prisma migrate deploy` before starting Next.js.
3. Confirm `https://meet.example.com/health/live` and `/health/ready` return HTTP 200.
4. Create two accounts and join the same meeting from two browsers to verify audio, video, and screen sharing through the public LiveKit domain.

Back up the `postgres-data` volume. Redis contains LiveKit coordination state and is not the source of truth for accounts or meeting history.
