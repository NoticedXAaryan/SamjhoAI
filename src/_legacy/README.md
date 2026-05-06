# _legacy/

These files are deprecated and must not be imported anywhere.
They exist only as reference during migration.
Delete this entire folder at Sprint 7 QA sign-off.

## Contents

- `clerk-auth/` — old Clerk middleware and auth helpers
- `mongo.ts` — old MongoDB client (replaced by Prisma + Neon)
- `client.ts` — old shared MongoDB client (replaced by Prisma + Neon)
- `useMediaDevices.ts` — orphaned hook, not used by any component
- `useSpeechToText.ts` — duplicate of `src/shared/hooks/useSpeechToText.ts`
- `CaptionsOverlay.tsx` — replaced by `src/features/captions/components/RealtimeCaptions.tsx`
