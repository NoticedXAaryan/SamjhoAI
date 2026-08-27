# `features/`

Feature modules. Each feature owns its types, repository, service, actions, and UI components.

The intended direction is for features not to import other features. The current code does not fully satisfy that rule; cross-feature caption, room, and guest-auth contracts are tracked as `ARCH-001` in `docs/engineering/ISSUE_REGISTER.md`. Do not add new cross-feature imports while the boundary is being repaired.

