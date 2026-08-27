# ADR 0002: Keep self-hosted LiveKit as the media plane

- Status: proposed
- Date: 2026-08-27

## Context

The product requires multi-party audio/video, screen sharing, data messages, reconnection, room control, guest access, and a future path to TURN and recording. Earlier P2P/Socket.IO architecture created scaling and reliability work. LiveKit is already integrated.

## Decision

Keep LiveKit and its Redis dependency self-hosted in the Dokploy stack for the baseline. Access it through a narrow server-side gateway. Use a public WSS domain for browser signaling, private Compose networking for admin RPC, and direct public media ports plus TURN/TLS.

## Consequences

- No required paid conferencing API.
- The operator owns media networking, capacity, upgrades, TURN, and observability.
- LiveKit-specific code remains isolated enough to permit a future managed LiveKit or provider change.
- Real network testing becomes a release requirement.

## Rejected alternatives

- Browser mesh P2P: unsuitable for dependable group meetings and moderation.
- Custom mediasoup: substantially more application and operations ownership.
- Jitsi embedding: conflicts with the custom product/UI boundary.
- Mandatory managed API: simpler operations but conflicts with the present self-hosting goal.

## Review condition

Revisit after measured operational cost, reliability, or scale data shows self-hosting is worse than a managed option.
