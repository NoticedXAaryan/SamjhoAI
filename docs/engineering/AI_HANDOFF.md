# AI and engineer handoff

## Mission

Recover Samjho AI into a dependable, self-hosted meeting product without redesigning its current UI and without another platform rewrite.

## Required reading order

1. `AGENTS.md` instructions supplied by the workspace/user.
2. `docs/README.md`.
3. `docs/engineering/CURRENT_STATE.md`.
4. `docs/engineering/ISSUE_REGISTER.md`.
5. `docs/engineering/TARGET_ARCHITECTURE.md`.
6. `docs/engineering/DELIVERY_PLAN.md`.
7. Relevant ADRs and topic runbooks.
8. Current Git status and the latest 20 commits.

Do not begin from `ROADMAP.md` or `PROJECT_BRIEF.md`; they are historical records of earlier architectures.

## Current repository guardrails

- The audited branch was `master` at `3ff3d67`, synchronized with `origin/master`.
- The user had uncommitted brand/metadata work in `README.md`, `src/app/layout.tsx`, `src/components/brand/BrandLogo.tsx`, `src/components/landing/LandingPage.tsx`, and image/manifest files under `public/brand` and `src/app`.
- Treat all pre-existing modifications and untracked files as user-owned. Never reset, overwrite, delete, stage, commit, or reformat them unless the task explicitly includes them.
- Preserve the current UI. Functional states may be added within its design language only when the assigned issue requires them.
- Do not introduce Vite as a second application runtime. Vitest may continue using Vite tooling.
- Do not replace LiveKit or split services without an accepted ADR and measured justification.
- Do not claim sign-language recognition, translation, recording, scheduling, or AI summarization until implemented and verified.

## First implementation task

Start with Phase 1 in `DELIVERY_PLAN.md`, specifically `REL-002`, `REL-003`, and `REL-004`:

1. reproduce install behavior in Linux Node 22/npm 10;
2. make the lockfile deterministic;
3. align CI and Docker on `npm ci` and the same image;
4. validate production environment variables before serving;
5. start the image against PostgreSQL and prove migrations plus health.

Do not start feature work until the Dokploy release artifact is reproducible and the latest public deployment is verified.

## Discovery workflow

- Prefer the codebase knowledge graph for symbols, callers, routes, and dependency impact.
- Use literal text/file search for Docker, Compose, environment variables, error messages, documentation, and other non-code configuration.
- Corroborate graph results with current files when results are stale, truncated, or framework entry points are misclassified.
- Inspect history before deleting migration residue.

## Verification commands

Run commands appropriate to the issue; do not blindly treat one aggregate command as proof.

```bash
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
docker compose config --quiet
docker build --tag samjho-ai:<git-sha> .
```

For production-image verification, use non-production secrets, start PostgreSQL plus the app, prove the migration, and probe `/health/live` and `/health/ready`. Media acceptance requires two browsers and a public or production-like network; localhost is insufficient.

## Environment contract

Current required production values:

- `POSTGRES_PASSWORD`
- `DATABASE_URL` inside the app, derived by Compose for the bundled database
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL=https://samjhoai.aaaryan.space`
- `GUEST_SESSION_SECRET`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `NEXT_PUBLIC_LIVEKIT_URL=wss://<livekit-domain>`
- `LIVEKIT_URL=http://livekit:7880` for the bundled self-hosted service

Never commit real values. `NEXT_PUBLIC_LIVEKIT_URL` is public and build-time embedded; all keys/secrets remain server-only.

## Change protocol

For each assigned issue:

1. State the issue ID and acceptance criteria.
2. Capture the pre-change failure with a focused test or reproducible command.
3. Make the smallest cohesive change.
4. Add failure-path and authorization tests.
5. Verify the production artifact when deployment is affected.
6. Update `CURRENT_STATE`, `ISSUE_REGISTER`, relevant ADR/runbook, and incident history if applicable.
7. Report exactly what was proven and what still requires the owner or public environment.

## Handoff note template

```text
Issue:
Status:
Commit/branch:
Files changed:
Behavior changed:
Verification run and result:
Deployment/migration impact:
Known limitations:
User-owned files intentionally untouched:
Next recommended issue:
```
