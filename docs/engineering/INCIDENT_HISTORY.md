# Architecture and incident history

This is an append-only engineering narrative. It records why current workarounds exist so a future contributor does not repeat or blindly preserve them.

## Legacy application era

Historical documents describe a Vite frontend, Express/Socket.IO backend, JWT/localStorage authentication, Prisma/Neon, P2P WebRTC, Cloudflare Pages, Render, and Electron experiments. Those systems are not the current runtime. Some product copy, environment variables, files, and comments survived the migration.

Consequence: repository text sometimes describes architecture that no longer exists. Archived documents are evidence, not instructions.

## Next.js consolidation

The project moved to a single Next.js App Router application. React remained because Next.js applications render React; this is expected. Vitest retained Vite tooling for test transformation only.

Consequence: there is no current Vite/Next production conflict, but stale Vite/archive references make the repository appear hybrid.

## Authentication churn

Git history shows Better Auth experiments, a Clerk reversion, a Clerk-based Next.js phase, then commit `ffe7c69` replacing Clerk with Better Auth and self-hosted PostgreSQL tables.

The migration commit message claimed email/password plus Google and GitHub OAuth. Current code configures email/password only. The initial migration is appropriate for a fresh database but is not a safe automatic upgrade from legacy auth schemas.

Lesson: commit messages and marketing text must not be treated as verification. Identity migrations require explicit data-adoption plans.

## Media deployment churn

The project used LiveKit, briefly removed local LiveKit/Redis in commit `b07cbc1` in favor of LiveKit Cloud, then restored self-hosted LiveKit and Redis for Dokploy. Commit `c15c272` added Dokploy's external network and Compose-managed inline LiveKit configuration.

Lesson: choose self-hosted or managed media per environment and record it as a decision. Do not flip topology in ad hoc deployment fixes.

## Dokploy failure sequence on 2026-08-27

### 1. Clean install rejected the lockfile

Observed errors included:

- `Invalid: lock file's picomatch@2.3.2 does not satisfy picomatch@4.0.7`
- `Missing: picomatch@2.3.2 from lock file`
- additional packages present in `package.json` but missing from the lockfile

Several lockfile regenerations were committed (`c432b95`, `79021f2`), but Linux `npm ci` remained unreliable relative to the Windows-generated tree. Commit `5ae112c` changed Docker to `npm install` as a deployment-first workaround.

Root cause class: package manifest/lock drift plus cross-platform npm resolution, aggravated by broad dependency churn and different CI/deploy install behavior. The existence of `picomatch` 2.x and 4.x is not itself an application conflict; they belong to different transitive tool chains.

Current state: deploy unblocked at the cost of reproducibility. Permanent resolution is `REL-002`.

### 2. Prisma could not reliably run in the slim image

The container warned that Prisma could not detect OpenSSL and later needed writable runtime files. Commit `7b1f080` installed OpenSSL in build and runtime stages and adjusted ownership.

Root cause class: runtime system dependency and permissions were not validated in the actual production base image.

Lesson: Docker image tests must execute migrations and application startup, not stop at `next build`.

### 3. Standalone output was launched with the wrong command

The container successfully applied migration `20260827000000_initial` and reported Next.js ready, but warned:

`next start does not work with output: standalone configuration. Use node .next/standalone/server.js instead.`

Behind Dokploy this manifested as Bad Gateway because the runtime contract was inconsistent. Commit `3ff3d67` changed the runner to copy the standalone output at `/app` and execute `node server.js`.

Root cause class: build output mode and runtime command were designed separately.

Current state: locally the production build succeeds; the public deployment after this exact fix still needs verification under `REL-001`.

## Systemic causes

- Platform decisions changed faster than documentation and tests.
- Deployment fixes were made one error at a time without a production-image smoke test.
- CI and Docker resolved dependencies differently.
- Historical artifacts remained discoverable without clear authority labels.
- Product controls and claims were added ahead of their underlying systems.
- Green commands were treated as readiness even when they did not exercise media, migration, proxy, or real network paths.

## Guardrails established by this audit

- Keep the Next.js modular monolith and LiveKit unless an ADR demonstrates a measured reason to change.
- Build and test the same production artifact.
- Use deployment evidence, not commit messages, as the source of truth.
- Preserve incident history and close issues only against explicit acceptance criteria.
- Separate baseline reliability from advanced AI/accessibility claims.
