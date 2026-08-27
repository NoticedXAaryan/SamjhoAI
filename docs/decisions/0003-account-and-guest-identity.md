# ADR 0003: Separate account identity from guest admission

- Status: proposed
- Date: 2026-08-27

## Context

Hosts need durable accounts and history. Invitees must be able to join a valid meeting without registering. Creating fake user records for guests pollutes identity and complicates privacy. The current signed guest cookie proves the direction but supports only one concurrent room and no host admission.

## Decision

Use Better Auth/PostgreSQL for accounts. Represent guests as room-scoped subjects admitted by meeting policy, not as `User` rows. Evolve the guest credential to support concurrent rooms, revocation/admission, and stable reconnect identity. Derive roles and LiveKit grants on the server.

## Consequences

- Guest join remains low friction.
- Host-only history and account operations remain simple.
- Meeting membership/attendance needs a subject model that can reference an account or guest.
- Waiting-room and abuse controls become application responsibilities.

## Rejected alternatives

- Require every participant to register: harms the core join experience.
- Store every guest as a permanent account: creates unwanted personal records and lifecycle problems.
- Trust client role/display-name data: unsafe.

## Review condition

Revisit the storage shape when implementing invitations, recurring guests, or organizational accounts, but preserve account/guest semantic separation.
