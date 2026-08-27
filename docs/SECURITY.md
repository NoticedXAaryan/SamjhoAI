# Security model

> This is a current trust-boundary summary. Prioritized remediation and completion criteria are maintained in [`engineering/ISSUE_REGISTER.md`](./engineering/ISSUE_REGISTER.md).

## Trust boundaries

Browser input is untrusted. The server validates meeting codes, display names, captions, account sessions, and signed guest sessions before using them. LiveKit tokens are generated only on the server and are scoped to one room.

## Account sessions

Better Auth owns account credentials and HttpOnly sessions in PostgreSQL. Production must set a unique `BETTER_AUTH_SECRET` and the exact public `BETTER_AUTH_URL`.

## Guest sessions

Guests receive a signed HttpOnly cookie containing a random guest ID, normalized display name, room name, and expiry. The HMAC secret is `GUEST_SESSION_SECRET`, falling back to `BETTER_AUTH_SECRET`. Verification uses constant-time signature comparison. A guest cookie cannot authorize another room or a meeting summary.

## LiveKit

Tokens contain a unique connection identity, participant metadata, one-room join permission, publish/subscribe permission, and a six-hour TTL. Hosts are derived from database ownership, never from request input. API keys and secrets are server-only.

Transport encryption is provided by HTTPS/WSS and WebRTC. Do not claim application-level end-to-end encryption until LiveKit E2EE and secure key distribution are explicitly implemented and tested.

## Current gaps

- The in-memory rate limiter is per application process and loses state on restart.
- Link possession currently grants guest entry; waiting-room admission and passcodes are planned.
- Content Security Policy needs to be tightened and tested against Next.js, LiveKit, and browser media requirements.
- Security event logging and alerting are not yet centralized.
- Secret rotation currently invalidates active account or guest sessions and requires an operational window.

Report suspected vulnerabilities privately to the project owner. Do not include production credentials, meeting links, transcripts, or personal information in public issues or logs.
