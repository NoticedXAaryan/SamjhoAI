# ADR 0001: Keep a Next.js modular monolith

- Status: proposed
- Date: 2026-08-27

## Context

Historical code and documents mention Vite, Express, Socket.IO, Electron, Cloudflare, Render, Vercel, and Next.js. The current runtime scripts are exclusively Next.js. React is required by Next.js, and Vite appears only in Vitest test tooling.

## Decision

Use one Next.js App Router deployment for web UI, HTTP/API delivery, server actions, authentication integration, and application use cases. Keep PostgreSQL and LiveKit as separate runtime services. Strengthen module boundaries inside the repository instead of splitting services or repositories.

Vite is allowed only as test infrastructure through Vitest unless a future ADR establishes a new application runtime.

## Consequences

- One deployment and one TypeScript application model remain easy to operate.
- Domain/application boundaries must be enforced because process separation will not enforce them.
- Long-running jobs may later require a worker, but that should be introduced for a concrete queue/workload.
- Stale Vite/Express deployment artifacts should be removed after history is preserved.

## Rejected alternatives

- Restore the Vite/Express application: repeats a completed migration and doubles deployment surface.
- Split into microservices now: adds network, consistency, and operations costs without measured scale pressure.

## Review condition

Revisit only when a measured workload cannot be served safely in the Next.js process or an independently scalable worker has a defined queue and ownership boundary.
