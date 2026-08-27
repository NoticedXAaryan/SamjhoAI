# Feature status

This document separates verified baseline behavior from planned work. Marketing copy must not claim planned capabilities as implemented.

## Implemented baseline

- Better Auth email/password accounts with PostgreSQL-backed sessions.
- Authenticated meeting creation, upcoming meetings, past meetings, and host-only end.
- Public meeting links with validated display-name guest joining.
- Room-scoped signed guest sessions without fake account records.
- LiveKit pre-join device selection, multi-party audio/video, screen sharing, remote audio, participant list, and chat.
- Host deletion of the LiveKit room when ending a meeting.
- Browser speech recognition, realtime caption broadcast, and PostgreSQL transcript persistence for accounts and guests.
- Host-only transcript summary and text download.
- Liveness and database readiness endpoints.
- Docker/Dokploy stack for the app, PostgreSQL, Redis, and LiveKit.

## Baseline limitations

- Browser speech recognition availability and accuracy vary by browser and operating system.
- The checked-in LiveKit setup exposes direct TCP/UDP media but does not yet configure TURN/TLS for the most restrictive corporate networks.
- Rate limiting is process-local; multiple app replicas require a shared limiter.
- Guest admission is link-based; a host-controlled waiting room and meeting passcode are not yet implemented.
- Automated tests cover domain, repositories, validation, and guest signing. Full browser-to-browser WebRTC remains a manual deployment verification step.

## Planned after baseline hardening

- Waiting room, meeting lock, passcodes, remove participant, and mute-request moderation.
- Server-supported translation and language selection.
- Verified sign-language recognition models with published evaluation metrics.
- Recording through self-hosted LiveKit Egress.
- Persistent accessibility preferences and additional caption controls.
- Shared distributed rate limiting, structured telemetry, and multi-node application deployment.
- Calendar integrations, reminders, search, and richer meeting scheduling.
