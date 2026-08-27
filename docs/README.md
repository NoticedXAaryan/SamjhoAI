# Samjho AI documentation

This directory is the project documentation entry point. The engineering record under [`engineering/`](./engineering/README.md) is the authoritative source for current state, risks, decisions, and delivery order.

## Read first

1. [`engineering/CURRENT_STATE.md`](./engineering/CURRENT_STATE.md) — what is actually implemented and verified.
2. [`engineering/ISSUE_REGISTER.md`](./engineering/ISSUE_REGISTER.md) — every known gap, with priority and acceptance criteria.
3. [`engineering/TARGET_ARCHITECTURE.md`](./engineering/TARGET_ARCHITECTURE.md) — the recommended end state.
4. [`engineering/DELIVERY_PLAN.md`](./engineering/DELIVERY_PLAN.md) — the ordered path from today to a dependable product.
5. [`engineering/AI_HANDOFF.md`](./engineering/AI_HANDOFF.md) — how a new engineer or AI agent safely resumes work.
6. [`engineering/INCIDENT_HISTORY.md`](./engineering/INCIDENT_HISTORY.md) — why the repository reached its current state.
7. [`decisions/README.md`](./decisions/README.md) — architecture decision records.

## Topic guides

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — short runtime and source-layout overview.
- [`FEATURES.md`](./FEATURES.md) — concise feature status.
- [`DEVELOPMENT.md`](./DEVELOPMENT.md) — local development commands and conventions.
- [`TESTING.md`](./TESTING.md) — current testing strategy and manual meeting test.
- [`SECURITY.md`](./SECURITY.md) — trust boundaries and known security gaps.
- [`OPERATIONS.md`](./OPERATIONS.md) — deployment, health, backup, and incident guidance.
- [`../deploy/SELF_HOSTING.md`](../deploy/SELF_HOSTING.md) — Dokploy-specific deployment instructions.

## Authority and maintenance

When documents disagree, use this order:

1. Running code, committed schema, and deployment configuration.
2. `docs/engineering/CURRENT_STATE.md` and `docs/engineering/ISSUE_REGISTER.md`.
3. Accepted records in `docs/decisions/`.
4. Topic guides in `docs/` and `deploy/`.
5. Archived root documents such as `ROADMAP.md` and `PROJECT_BRIEF.md`.

Every behavior-changing pull request must update the affected status, issue, decision, test, and operations documentation in the same change. Never describe an aspirational feature as implemented.
