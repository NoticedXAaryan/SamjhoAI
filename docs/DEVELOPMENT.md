# Development guide

## Prerequisites

- Node.js 22 or newer.
- npm with the committed lockfile.
- PostgreSQL 15 or newer.
- A LiveKit server for actual meeting media. The complete Compose stack is intended for Linux deployment; local UI and unit work can use an external development LiveKit instance.

## Setup

```bash
npm ci
cp .env.example .env.local
npx prisma migrate deploy
npm run dev
```

Open `http://localhost:3000`.

Required variables are documented in `.env.example`. Secrets must contain at least 32 random characters. `NEXT_PUBLIC_LIVEKIT_URL` is browser-visible; API secrets must never use the `NEXT_PUBLIC_` prefix.

## Database workflow

- Change `prisma/schema.prisma`.
- Create and review a migration locally with `npx prisma migrate dev --name <change>`.
- Commit the generated migration.
- Production uses `npx prisma migrate deploy`; never use `db push` as the deployment migration strategy.

Use a fresh database for the recovered Better Auth schema unless an explicit legacy data migration has been written and rehearsed.

## Quality commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run check
```

`npm run check` is the merge gate. Build environments must provide non-default Better Auth configuration; CI uses non-production placeholder values.

## Dependency rules

- Do not import Prisma or provider SDKs from React components.
- Validate untrusted input at API, action, cookie, and realtime-message boundaries.
- Never trust user IDs or display names sent by the browser; derive them from the account or signed guest session.
- Keep server secrets out of client components and `NEXT_PUBLIC_*` variables.
- Update documentation and tests in the same change as behavior.
