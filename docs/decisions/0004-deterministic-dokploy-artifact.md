# ADR 0004: Make one deterministic artifact the release unit

- Status: proposed
- Date: 2026-08-27

## Context

Linux `npm ci` rejected a lockfile generated through repeated Windows dependency changes. Docker was changed to `npm install` to unblock deployment, while CI kept `npm ci`. Later Prisma/OpenSSL and standalone-start errors appeared only in the container. The current gates do not test what Dokploy actually runs.

## Decision

Generate and validate the npm lockfile in Linux Node 22/npm 10, use `npm ci` for reproducible dependency stages, and make the production Docker image the release artifact. CI builds and smoke-tests that image. Dokploy deploys it by immutable Git SHA/digest. Database migrations use an explicit, observable step from the same revision.

## Consequences

- A commit has one dependency tree and runtime contract.
- Lockfile or image problems fail before production.
- CI remains focused on deploy confidence; broader checks can be phased without blocking on flaky, non-actionable rules.
- The temporary `npm install` workaround must be removed only after the Linux clean-install test proves the replacement.

## Rejected alternatives

- Keep `npm install` indefinitely: non-reproducible and vulnerable to registry-time drift.
- Ignore CI and test only in Dokploy: slow feedback and repeated production debugging.
- Maintain separate production and CI install methods: creates false confidence.

## Review condition

Revisit the package manager or build system only with a migration plan that preserves deterministic Linux builds and Docker smoke coverage.
