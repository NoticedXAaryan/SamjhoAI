# Archived roadmap — historical reference only

> This file describes an earlier Clerk-based recovery plan and is not authoritative for the current application. Do not implement from it. Current behavior and priorities are documented in [`docs/FEATURES.md`](./docs/FEATURES.md), [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md), and [`deploy/SELF_HOSTING.md`](./deploy/SELF_HOSTING.md).

# 🗺️ Samjho AI — Legacy Master Roadmap

<div align="center">

**Status:** 75% → Target 95% Production Ready  
**Timeline:** 12–16 weeks · 8 Sprints  
**Auth:** Clerk (current stack)  
**UI:** shadcn/ui + TailwindCSS v4  
**Architecture:** Feature-modules · Repository pattern · SOLID  
**Last Updated:** May 6, 2026 (Sprint 0–4 completed)

</div>

> **One rule:** Read this file top to bottom once before touching any code. Every decision is explained here. The landing page is **never touched**.

---

## 📋 Current State Audit

| Area | Score | Status |
|------|-------|--------|
| Authentication | 90% ✅ | Clerk integrated — sign-in/up/middleware/protected routes all work |
| Video Engine | 85% ✅ | LiveKit room + controls + screen share + end-call dialog |
| UI Framework | 90% ✅ | Landing page + dashboard + meeting room + summary — all shadcn/ui |
| Database | 80% ✅ | Prisma + Neon Postgres — meetings + transcripts persisted |
| Real-Time Captions | 75% ✅ | Speech-to-text broadcast + receive + persist + summary display |
| Architecture | 85% ✅ | Feature-modules + Repository + Service + Actions + SOLID |
| Error Handling | 60% 🟡 | Zod validation schemas created, need to wire into all actions |
| Security | 70% 🟡 | Clerk middleware + rate limiting + security headers — need CSP |
| Testing | 0% ❌ | Zero tests (Sprint 5 planned) |

---

## 🔴 Decisions Made (Non-Negotiable)

**1. Use Clerk for authentication (current stack)**
Clerk remains the authentication provider for now.

**2. Standardize on Prisma + Neon Postgres**
Neon Postgres is the single database. Prisma is the single schema + migration workflow. Remove MongoDB usage and any dual-DB ambiguity.

**3. Move old/unused code to `_legacy/`**
Do not delete old files immediately. Move them to `src/_legacy/` with a README. Review and delete at Sprint 7 QA. This avoids accidental loss of logic that may still be referenced.

**4. Feature-module architecture (SOLID)**
Each feature is a self-contained folder with its own types, repository, service, actions, and components. Nothing imports across feature boundaries except through `shared/`. This enforces Single Responsibility and Interface Segregation.

**5. Repository + Service pattern**
Data access goes in `.repository.ts`. Business logic goes in `.service.ts`. Server actions are thin wrappers that call services. UI components call server actions only. No component touches a database directly.

**6. shadcn/ui — no other UI library**
shadcn/ui copies components into your codebase, has zero runtime overhead, is built on Radix UI (accessible by default), and works natively with TailwindCSS v4. No other component library is needed.

---

## 📦 Package Cleanup

### Remove these completely (if present)

```bash
# Remove DB remnants (only if present)
# - MongoDB helpers / adapters you no longer use
# - any "dual DB" wiring (Mongo + Prisma) that creates ambiguity
```

### Add these

```bash
# Validation (if not already installed)
npm install zod
```

### Keep these (no changes)

```
next, react, react-dom
typescript
tailwindcss
@livekit/components-react, @livekit/components-styles, livekit-client, livekit-server-sdk
mongodb
lucide-react
motion (Framer Motion — used by landing page)
```

### Final `package.json` dependencies (target state)

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@clerk/nextjs": "^7.0.0",
    "@clerk/backend": "^3.0.0",
    "livekit-server-sdk": "^2.0.0",
    "@livekit/components-react": "^2.0.0",
    "@livekit/components-styles": "^1.0.0",
    "livekit-client": "^2.0.0",
    "zod": "^3.0.0",
    "lucide-react": "^0.400.0",
    "motion": "^11.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@playwright/test": "^1.40.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0"
  }
}
```

---

## 🏗️ Target Architecture

### SOLID Principles Applied

**S — Single Responsibility**
Every file has exactly one reason to change. `MeetingRepository` only handles data access. `MeetingService` only handles business logic. `MeetingCard` only renders one card.

**O — Open/Closed**
Features extend the system without modifying existing code. Adding a new caption type means adding a new type to the union and a new handler — not editing existing handlers.

**L — Liskov Substitution**
All repositories implement a shared interface. Any implementation (MongoDB, in-memory for tests) can replace another without breaking callers.

**I — Interface Segregation**
Types are small and focused. `CreateMeetingInput` is not the same as `Meeting`. Components receive only the props they need — no fat prop objects.

**D — Dependency Inversion**
Server actions depend on `IMeetingService` interface, not on `MeetingService` concretion. This makes testing trivial — inject a mock service.

---

### Folder Structure (Target State After All Sprints)

```
src/
│
├── app/                              # Next.js App Router — routing only
│   ├── (auth)/                       # Public auth routes
│   │   ├── sign-in/
│   │   │   └── page.tsx
│   │   └── sign-up/
│   │       └── page.tsx
│   ├── (app)/                        # Protected route group
│   │   ├── layout.tsx                # Session guard — redirect if not authed
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Thin — just calls features/meetings
│   │   └── meeting/
│   │       └── [roomId]/
│   │           ├── page.tsx          # Thin — validates room, renders MeetingRoom
│   │           └── summary/
│   │               └── page.tsx      # Thin — renders transcript
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...all]/
│   │   │       └── route.ts          # Clerk webhooks/handlers (if used)
│   │   └── livekit/
│   │       └── token/
│   │           └── route.ts          # LiveKit token (server-only)
│   ├── layout.tsx                    # Root layout — no auth provider needed
│   └── globals.css
│
├── features/                         # Self-contained feature modules
│   │
│   ├── auth/                         # Everything auth-related
│   │   └── (clerk)                   # Clerk is used directly in app routes/components
│   │
│   ├── meetings/                     # Meeting CRUD and dashboard
│   │   ├── meetings.types.ts         # Interfaces only — no implementation
│   │   ├── meetings.repository.ts    # IMeetingRepository + MongoMeetingRepository
│   │   ├── meetings.service.ts       # IMeetingService + MeetingService
│   │   ├── meetings.actions.ts       # Server actions — thin wrappers
│   │   └── components/
│   │       ├── HeroCard.tsx
│   │       ├── MeetingCard.tsx
│   │       ├── MeetingCardSkeleton.tsx
│   │       ├── PastMeetingRow.tsx
│   │       └── DashboardHeader.tsx
│   │
│   ├── room/                         # In-meeting experience
│   │   ├── room.types.ts
│   │   ├── room.service.ts           # Token generation, room validation
│   │   └── components/
│   │       ├── MeetingRoom.tsx       # LiveKit shell
│   │       ├── VideoGrid.tsx
│   │       ├── ControlBar.tsx
│   │       ├── ParticipantSidebar.tsx
│   │       ├── MeetingTopBar.tsx
│   │       └── AccessibilitySheet.tsx
│   │
│   └── captions/                     # Caption broadcast and display
│       ├── captions.types.ts
│       ├── captions.repository.ts    # Transcript persistence
│       ├── captions.service.ts       # Broadcast logic
│       ├── captions.actions.ts       # saveCaptionSegment server action
│       └── components/
│           └── RealtimeCaptions.tsx
│
├── shared/                           # Cross-feature shared code
│   ├── components/
│   │   └── ui/                       # shadcn/ui — do not edit manually
│   ├── db/
│   │   └── setup.ts                  # Index creation script (if needed)
│   ├── hooks/
│   │   ├── useSpeechToText.ts
│   │   └── useGestureDetection.ts
│   ├── lib/
│   │   ├── livekit.ts                # CaptionBroadcaster + parseCaptionPacket
│   │   ├── validation.ts             # Shared Zod schemas
│   │   └── utils.ts                  # cn(), formatDuration(), etc.
│   └── middleware.ts                 # Rate limiting + security headers
│
├── middleware.ts                     # Next.js middleware — auth guard
│
└── _legacy/                          # Deprecated — review at Sprint 7, then delete
    ├── README.md                     # "Do not import from here"
    ├── clerk-auth/                   # Old Clerk integration
    ├── prisma/                       # Old Prisma schema + client
    └── old-actions/                  # Old flat server actions
```

### Import Rules

These rules prevent circular dependencies and keep the architecture clean:

```
app/          → features/, shared/          ✅
features/     → shared/                     ✅
features/     → other features/             ❌  (never cross-import features)
shared/       → features/                   ❌  (shared knows nothing about features)
_legacy/      → anywhere                    ❌  (nothing imports from _legacy)
```

---

## 🗺️ UX Flow

The landing page is untouched. Every screen below it is new.

```
┌─────────────────────────────────────────────────────────┐
│  LANDING PAGE  /  (existing — never touch)              │
└───────────────────┬─────────────────────────────────────┘
                    │  [Sign In] / [Get Started]
                    ▼
┌─────────────────────────────────────────────────────────┐
│  SIGN IN  /sign-in                                      │
│  Clerk sign-in                                          │
│  (OAuth configured in Clerk dashboard)                  │
│  "Don't have an account? Sign up"                       │
└───────────────────┬─────────────────────────────────────┘
                    │  session cookie set
                    ▼
┌─────────────────────────────────────────────────────────┐
│  DASHBOARD  /dashboard                                  │
│                                                         │
│  ┌─ Header ──────────────────────────────────────────┐ │
│  │  🤟 Samjho              [avatar] [name] [sign out]│ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ Hero Card ───────────────────────────────────────┐ │
│  │  "Welcome back, [name]"                           │ │
│  │  [▶ New Meeting]    [Room code ____] [→ Join]     │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Upcoming  ──────────────────────────────────────────  │
│  [Card: title · time · n👤 · Join]  ×3 per row         │
│                                                         │
│  Past Meetings  ─────────────────────────────────────  │
│  row: title · date · duration · [↓ Transcript]         │
└───────────────────┬─────────────────────────────────────┘
                    │  [New Meeting] → creates + saves to DB
                    │  [Join]        → validates roomId → enters
                    ▼
┌─────────────────────────────────────────────────────────┐
│  MEETING ROOM  /meeting/[roomId]                        │
│                                                         │
│  ┌─ Top bar ─────────────────────────────────────────┐ │
│  │  Title          ●Live  🕐 12:34    [👥 3 people]  │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ Video Grid ───────────────────┐ ┌─ Sidebar ──────┐ │
│  │  [Tile]  [Tile]                │ │ ● Alice         │ │
│  │  [Tile]  [You]                 │ │ ● Bob  🔇        │ │
│  │                                │ │ ● You   HOST   │ │
│  │  ┌── Captions overlay ───────┐ │ └────────────────┘ │
│  │  │ Alice: "Can you hear me?" │ │                    │
│  │  │ 🤟 Bob: ASL_HELLO        │ │                    │
│  │  └───────────────────────────┘ │                    │
│  └────────────────────────────────┘                    │
│                                                         │
│  ┌─ Control bar ─────────────────────────────────────┐ │
│  │      [🎤]   [📷]   [🖥]   │   [⚙]   [📞 End]    │ │
│  └───────────────────────────────────────────────────┘ │
└───────────────────┬─────────────────────────────────────┘
                    │  End Call (confirmation dialog)
                    ▼
┌─────────────────────────────────────────────────────────┐
│  SUMMARY  /meeting/[roomId]/summary                     │
│                                                         │
│  "Meeting ended · 45 min"                               │
│  ┌─ Transcript ──────────────────────────────────────┐ │
│  │ 12:03 Alice  "Can everyone hear me?"              │ │
│  │ 12:04 🤟 Bob  ASL_HELLO                           │ │
│  │ 12:05 You    "Yes, loud and clear"                │ │
│  └───────────────────────────────────────────────────┘ │
│  [↓ Download .txt]          [← Back to Dashboard]      │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 UI: shadcn/ui Setup

Install once in Sprint 0, extend per sprint:

```bash
npx shadcn@latest init
# Prompts:
# Style        → Default
# Base color   → Slate
# CSS vars     → Yes
```

**Brand tokens — paste into `app/globals.css` after shadcn init:**

```css
@layer base {
  :root {
    --background:         0 0% 2%;      /* #050507 — existing brand bg */
    --foreground:         0 0% 98%;
    --card:               0 0% 4%;
    --card-foreground:    0 0% 98%;
    --border:             0 0% 10%;
    --input:              0 0% 8%;
    --primary:            187 100% 50%; /* cyan — brand accent */
    --primary-foreground: 0 0% 2%;
    --muted:              0 0% 8%;
    --muted-foreground:   0 0% 55%;
    --accent:             187 100% 10%;
    --destructive:        0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    --radius:             0.75rem;
  }
}
```

**Add components per sprint — only when needed:**

```bash
# Sprint 0
npx shadcn@latest add button input label card badge avatar skeleton

# Sprint 1
npx shadcn@latest add tooltip

# Sprint 2
npx shadcn@latest add sheet scroll-area separator

# Sprint 3
npx shadcn@latest add switch select alert-dialog dropdown-menu

# Sprint 4
npx shadcn@latest add form toast
```

---

## ⚡ Sprint-by-Sprint Plan

---

### Sprint 0 (Week 0): Clean Slate ✅ COMPLETED
**Goal:** Erase technical debt before writing a single new line.

**Order matters. Do not skip steps.**

**Step 1 — Uninstall dead packages (svix, mongodb, Better Auth stubs):**
```bash
# Prisma is KEPT (it's the active DB layer with Neon Postgres)
npm uninstall svix mongodb
```

**Step 2 — Audit all imports, move old files to `_legacy/`:**
```bash
mkdir -p src/_legacy/clerk-auth src/_legacy/prisma src/_legacy/old-actions

# Move old Clerk files
mv src/middleware.ts src/_legacy/clerk-auth/middleware.ts
# (move any other Clerk-importing files similarly)

# Move Prisma directory
mv prisma/ src/_legacy/prisma/

# Create _legacy README
cat > src/_legacy/README.md << 'EOF'
# _legacy/

These files are deprecated and must not be imported anywhere.
They exist only as reference during migration.
Delete this entire folder at Sprint 7 QA sign-off.

- clerk-auth/   — old Clerk middleware and auth helpers
- prisma/       — old Prisma schema and client
- old-actions/  — old flat server actions
EOF
```

**Step 3 — Install new packages:**
```bash
npm install zod
npx shadcn@latest init
npx shadcn@latest add button input label card badge avatar skeleton
```

**Step 4 — Create folder skeleton:**
```bash
mkdir -p src/features/auth/components
mkdir -p src/features/meetings/components
mkdir -p src/features/room/components
mkdir -p src/features/captions/components
mkdir -p src/shared/db
mkdir -p src/shared/hooks
mkdir -p src/shared/lib
mkdir -p src/shared/components/ui
```

**Sprint 0 Deliverable:** `npm run build` succeeds (with stub pages). Clean folder structure in place. ✅

---

### Sprint 1 (Weeks 1–2): Clerk Auth + Database ✅ COMPLETED
**Goal:** Working authentication (sign in, sign up, session) and real meeting persistence.

#### 1.1 — Prisma + Neon (single DB)

**Database:** Neon Postgres  
**Schema + migrations:** Prisma (`prisma/schema.prisma`)  
**Connection:** `DATABASE_URL` (never commit real credentials)

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
```

**Apply schema to Neon (dev):**

```bash
npx prisma db push
```

**Preferred for production:** use Prisma migrations (`npx prisma migrate dev` locally, deploy migrations in CI).

#### 1.2 — Clerk Setup (current stack)

Use Clerk’s Next.js integration:

- Pages: `/sign-in` and `/sign-up` (Clerk components)
- Protect routes (`/dashboard`, `/meeting/*`) using `auth()` in layouts or middleware
- Use `currentUser()` server-side for API routes (e.g. minting LiveKit tokens)

#### 1.3 — Auth API Route

Clerk does not require a Next.js catch-all auth handler route like Better Auth.

Keep Clerk configuration in env vars and use Clerk components/hooks/server helpers.

#### 1.4 — Next.js Middleware (auth guard)

```typescript
// src/middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const PROTECTED = ['/dashboard', '/meeting'];
const isProtectedRoute = createRouteMatcher(PROTECTED);

// In-memory rate limiter (swap for Upstash Redis when scaling)
const rl = new Map<string, { n: number; reset: number }>();

function isRateLimited(key: string, max = 60): boolean {
  const now = Date.now();
  const e = rl.get(key) ?? { n: 0, reset: now + 60_000 };
  if (now > e.reset) { rl.set(key, { n: 1, reset: now + 60_000 }); return false; }
  if (e.n >= max) return true;
  e.n++;
  rl.set(key, e);
  return false;
}

function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  return res;
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';

  // Rate limit — 60 req/min per IP per path
  if (isRateLimited(`${ip}:${pathname}`)) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  if (isProtectedRoute(req)) await auth.protect();

  return addSecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
```

#### 1.5 — Auth Forms

Use Clerk UI components on `/sign-in` and `/sign-up` (no custom forms required).

```typescript
// src/features/auth/components/SignInForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { signIn } from '@/features/auth/auth.client';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message ?? 'Invalid email or password.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">Enter your email and password to continue.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email" type="email" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)}
            required autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password" type="password" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)}
            required autoComplete="current-password"
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" className="text-foreground underline underline-offset-4 hover:text-primary">
          Sign up
        </Link>
      </p>
    </div>
  );
}
```

```typescript
// src/features/auth/components/SignUpForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { signUp } from '@/features/auth/auth.client';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export function SignUpForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signUp.email({
      email: form.email,
      password: form.password,
      name: form.name,
    });

    if (result.error) {
      setError(result.error.message ?? 'Could not create account.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-muted-foreground">Start using Samjho for free.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Your name" value={form.name} onChange={set('name')} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="Min 8 characters" value={form.password} onChange={set('password')} required minLength={8} />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-foreground underline underline-offset-4 hover:text-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}
```

```typescript
// src/features/auth/components/UserMenu.tsx
// Replaces Clerk's <UserButton /> — self-contained, no external dependency
'use client';

import { signOut, useSession } from '@/features/auth/auth.client';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { LogOut, User } from 'lucide-react';

export function UserMenu() {
  const { data: session } = useSession();
  const router = useRouter();
  const name = session?.user?.name ?? 'User';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full outline-none ring-2 ring-transparent focus-visible:ring-primary transition-all">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <User className="h-4 w-4" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive"
          onClick={handleSignOut}>
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### 1.6 — Meetings: Types → Repository → Service → Actions

```typescript
// src/features/meetings/meetings.types.ts
// I — Interface Segregation: small focused types only

export interface Meeting {
  _id: string;
  roomId: string;
  title: string;
  organizerId: string;
  status: 'scheduled' | 'active' | 'ended';
  startTime: Date;
  endTime: Date | null;
  participantCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMeetingInput {
  title?: string;
  organizerId: string;
}

export interface AccessibilityPreferences {
  captionsEnabled: boolean;
  captionsSize: 'sm' | 'md' | 'lg';
  captionsPosition: 'top' | 'bottom';
  gestureDisplayEnabled: boolean;
  highContrast: boolean;
  preferredLanguage: string;
}

// D — Dependency Inversion: depend on this interface, not the implementation
export interface IMeetingRepository {
  create(input: CreateMeetingInput): Promise<Pick<Meeting, 'roomId'>>;
  findByRoomId(roomId: string): Promise<Meeting | null>;
  findUpcomingByUser(userId: string): Promise<Meeting[]>;
  findPastByUser(userId: string): Promise<Meeting[]>;
  markActive(roomId: string): Promise<void>;
  markEnded(roomId: string, organizerId: string): Promise<void>;
}

export interface IMeetingService {
  createMeeting(title: string | undefined, userId: string): Promise<{ roomId: string }>;
  validateAndJoin(roomId: string): Promise<{ roomId: string; title: string }>;
  getUpcoming(userId: string): Promise<Meeting[]>;
  getPast(userId: string): Promise<Meeting[]>;
  endMeeting(roomId: string, userId: string): Promise<void>;
}
```

```typescript
// src/features/meetings/meetings.repository.ts
// S — Single Responsibility: only data access

import { getDb } from '@/shared/db/client';
import type { IMeetingRepository, Meeting, CreateMeetingInput } from './meetings.types';

function generateRoomId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const seg = () => Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${seg()}-${seg()}-${seg()}`; // e.g. "xk2m-r9jq-4lpw"
}

function formatTitle(title?: string): string {
  if (title?.trim()) return title.trim();
  return `Meeting · ${new Date().toLocaleString('en', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })}`;
}

// L — Liskov: this class fully satisfies IMeetingRepository
export class MongoMeetingRepository implements IMeetingRepository {
  private async col() {
    return (await getDb()).collection('meetings');
  }

  async create(input: CreateMeetingInput): Promise<Pick<Meeting, 'roomId'>> {
    const col = await this.col();
    const roomId = generateRoomId();
    await col.insertOne({
      roomId,
      title: formatTitle(input.title),
      organizerId: input.organizerId,
      status: 'scheduled',
      startTime: new Date(),
      endTime: null,
      participantCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { roomId };
  }

  async findByRoomId(roomId: string): Promise<Meeting | null> {
    const col = await this.col();
    const doc = await col.findOne({ roomId });
    if (!doc) return null;
    return { ...doc, _id: doc._id.toString() } as Meeting;
  }

  async findUpcomingByUser(userId: string): Promise<Meeting[]> {
    const col = await this.col();
    const docs = await col
      .find({ organizerId: userId, status: { $in: ['scheduled', 'active'] } })
      .sort({ startTime: -1 }).limit(20).toArray();
    return docs.map(d => ({ ...d, _id: d._id.toString() })) as Meeting[];
  }

  async findPastByUser(userId: string): Promise<Meeting[]> {
    const col = await this.col();
    const docs = await col
      .find({ organizerId: userId, status: 'ended' })
      .sort({ endTime: -1 }).limit(50).toArray();
    return docs.map(d => ({ ...d, _id: d._id.toString() })) as Meeting[];
  }

  async markActive(roomId: string): Promise<void> {
    const col = await this.col();
    await col.updateOne(
      { roomId },
      { $set: { status: 'active', updatedAt: new Date() } }
    );
  }

  async markEnded(roomId: string, organizerId: string): Promise<void> {
    const col = await this.col();
    await col.updateOne(
      { roomId, organizerId },
      { $set: { status: 'ended', endTime: new Date(), updatedAt: new Date() } }
    );
  }
}
```

```typescript
// src/features/meetings/meetings.service.ts
// S — Single Responsibility: only business logic
// D — Dependency Inversion: receives IMeetingRepository, not the concrete class

import type { IMeetingRepository, IMeetingService, Meeting } from './meetings.types';

export class MeetingService implements IMeetingService {
  constructor(private readonly repo: IMeetingRepository) {}

  async createMeeting(title: string | undefined, userId: string) {
    return this.repo.create({ title, organizerId: userId });
  }

  async validateAndJoin(roomId: string) {
    const meeting = await this.repo.findByRoomId(roomId);
    if (!meeting || meeting.status === 'ended') {
      throw new Error('Meeting not found or already ended.');
    }
    if (meeting.status === 'scheduled') {
      await this.repo.markActive(roomId);
    }
    return { roomId: meeting.roomId, title: meeting.title };
  }

  async getUpcoming(userId: string): Promise<Meeting[]> {
    return this.repo.findUpcomingByUser(userId);
  }

  async getPast(userId: string): Promise<Meeting[]> {
    return this.repo.findPastByUser(userId);
  }

  async endMeeting(roomId: string, userId: string): Promise<void> {
    const meeting = await this.repo.findByRoomId(roomId);
    if (!meeting) throw new Error('Meeting not found.');
    if (meeting.organizerId !== userId) throw new Error('Only the host can end the meeting.');
    await this.repo.markEnded(roomId, userId);
  }
}
```

```typescript
// src/features/meetings/meetings.actions.ts
// Thin server actions — authenticate, then delegate to service
// O — Open/Closed: adding new meeting features means adding new actions, not editing this file

'use server';

import { requireSession } from '@/features/auth/session';
import { MongoMeetingRepository } from './meetings.repository';
import { MeetingService } from './meetings.service';

// Compose once per invocation (Next.js caches db connections via singleton)
function makeService() {
  return new MeetingService(new MongoMeetingRepository());
}

export async function createMeeting(title?: string) {
  const session = await requireSession();
  return makeService().createMeeting(title, session.user.id);
}

export async function validateAndJoinMeeting(roomId: string) {
  await requireSession(); // Must be signed in to join
  return makeService().validateAndJoin(roomId);
}

export async function getUpcomingMeetings() {
  const session = await requireSession();
  return makeService().getUpcoming(session.user.id);
}

export async function getPastMeetings() {
  const session = await requireSession();
  return makeService().getPast(session.user.id);
}

export async function endMeeting(roomId: string) {
  const session = await requireSession();
  return makeService().endMeeting(roomId, session.user.id);
}
```

**Sprint 1 Deliverable:** Sign up, sign in, sign out all work via Clerk. Dashboard reads real meetings from Neon Postgres (via Prisma). "New Meeting" creates and redirects. Protected routes redirect to sign-in. ✅

---

### Sprint 2 (Weeks 3–4): Captions Feature Module ✅ COMPLETED

```bash
npx shadcn@latest add sheet scroll-area separator
```

#### Captions Types → Repository → Service → Action → Component

```typescript
// src/features/captions/captions.types.ts

export interface CaptionPacket {
  id: string;
  userId: string;
  userName: string;
  type: 'speech' | 'gesture';
  content: string;
  gestureType?: string;
  language: string;
  confidence: number;
  timestamp: number;
}

export interface TranscriptSegment {
  timestamp: number;
  type: 'speech' | 'gesture';
  content: string;
  userId: string;
  userName: string;
  language: string;
  confidence: number;
  gestureType?: string;
}

export interface Transcript {
  _id: string;
  meetingId: string;
  segments: TranscriptSegment[];
  createdAt: Date;
}

export interface ICaptionRepository {
  appendSegment(roomId: string, segment: TranscriptSegment): Promise<void>;
  findByRoomId(roomId: string): Promise<Transcript | null>;
}
```

```typescript
// src/features/captions/captions.repository.ts

import { getDb } from '@/shared/db/client';
import type { ICaptionRepository, Transcript, TranscriptSegment } from './captions.types';

export class MongoCaptionRepository implements ICaptionRepository {
  private async meetingsCol() {
    return (await getDb()).collection('meetings');
  }
  private async transcriptsCol() {
    return (await getDb()).collection('transcripts');
  }

  async appendSegment(roomId: string, segment: TranscriptSegment): Promise<void> {
    const meetings = await this.meetingsCol();
    const meeting = await meetings.findOne({ roomId });
    if (!meeting) return;

    const transcripts = await this.transcriptsCol();
    await transcripts.updateOne(
      { meetingId: meeting._id.toString() },
      {
        $push: { segments: segment } as any,
        $setOnInsert: { meetingId: meeting._id.toString(), createdAt: new Date() },
      },
      { upsert: true }
    );
  }

  async findByRoomId(roomId: string): Promise<Transcript | null> {
    const meetings = await this.meetingsCol();
    const meeting = await meetings.findOne({ roomId });
    if (!meeting) return null;

    const transcripts = await this.transcriptsCol();
    const doc = await transcripts.findOne({ meetingId: meeting._id.toString() });
    if (!doc) return null;
    return { ...doc, _id: doc._id.toString() } as Transcript;
  }
}
```

```typescript
// src/features/captions/captions.actions.ts
'use server';

import { requireSession } from '@/features/auth/session';
import { MongoCaptionRepository } from './captions.repository';
import type { TranscriptSegment } from './captions.types';

export async function saveCaptionSegment(roomId: string, segment: TranscriptSegment) {
  await requireSession();
  const repo = new MongoCaptionRepository();
  await repo.appendSegment(roomId, segment);
}

export async function getTranscript(roomId: string) {
  await requireSession();
  const repo = new MongoCaptionRepository();
  return repo.findByRoomId(roomId);
}
```

```typescript
// src/shared/lib/livekit.ts
// S — Single Responsibility: LiveKit broadcast utilities only

import { DataPacket_Kind } from 'livekit-client';
import type { CaptionPacket } from '@/features/captions/captions.types';

export async function broadcastCaption(room: any, caption: CaptionPacket): Promise<void> {
  if (!room?.localParticipant) return;
  const payload = new TextEncoder().encode(JSON.stringify(caption));
  await room.localParticipant.publishData(payload, DataPacket_Kind.LOSSY);
}

export function parseCaptionPacket(raw: Uint8Array): CaptionPacket | null {
  try { return JSON.parse(new TextDecoder().decode(raw)); }
  catch { return null; }
}
```

```typescript
// src/shared/hooks/useSpeechToText.ts
'use client';

import { useCallback, useRef } from 'react';
import { useRoom } from '@livekit/components-react';
import { broadcastCaption } from '@/shared/lib/livekit';
import { saveCaptionSegment } from '@/features/captions/captions.actions';
import type { CaptionPacket } from '@/features/captions/captions.types';

export function useSpeechToText(roomId: string, userName: string, userId: string) {
  const room = useRoom();
  const ref = useRef<SpeechRecognition | null>(null);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition: SpeechRecognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) continue;
        const text = event.results[i][0].transcript.trim();
        if (!text) continue;

        const caption: CaptionPacket = {
          id: crypto.randomUUID(), userId, userName,
          type: 'speech', content: text, language: 'en-US',
          confidence: event.results[i][0].confidence,
          timestamp: Date.now(),
        };

        await broadcastCaption(room, caption);

        // Non-blocking persist — don't await, don't block UI
        saveCaptionSegment(roomId, {
          timestamp: caption.timestamp, type: 'speech', content: text,
          userId, userName, language: 'en-US', confidence: caption.confidence,
        });
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'audio-capture') recognition.start();
    };

    recognition.start();
    ref.current = recognition;
  }, [room, roomId, userId, userName]);

  const stop = useCallback(() => {
    ref.current?.stop();
    ref.current = null;
  }, []);

  return { start, stop };
}
```

```typescript
// src/features/captions/components/RealtimeCaptions.tsx
'use client';

import { useState, useEffect } from 'react';
import { useDataMessage } from '@livekit/components-react';
import { parseCaptionPacket } from '@/shared/lib/livekit';
import type { CaptionPacket } from '../captions.types';
import { cn } from '@/shared/lib/utils';

const sizeClass = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' } as const;

interface Props {
  enabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top' | 'bottom';
}

type LiveCaption = CaptionPacket & { expireAt: number };

export function RealtimeCaptions({ enabled = true, size = 'md', position = 'bottom' }: Props) {
  const [captions, setCaptions] = useState<LiveCaption[]>([]);

  useDataMessage((msg) => {
    if (!enabled) return;
    const caption = parseCaptionPacket(msg.payload);
    if (!caption) return;
    setCaptions(prev => [{ ...caption, expireAt: Date.now() + 5000 }, ...prev].slice(0, 5));
  });

  useEffect(() => {
    const t = setInterval(() => {
      setCaptions(prev => prev.filter(c => Date.now() < c.expireAt));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  if (!enabled || captions.length === 0) return null;

  return (
    <div className={cn(
      'absolute left-4 right-4 z-20 space-y-1.5 pointer-events-none',
      position === 'bottom' ? 'bottom-20' : 'top-16'
    )}>
      {captions.map(c => (
        <div
          key={c.id}
          className="max-w-xl mx-auto rounded-lg bg-black/85 backdrop-blur-sm border border-white/10 px-4 py-2"
        >
          <p className="text-xs text-muted-foreground mb-0.5">{c.userName}</p>
          <p className={cn('text-white font-medium', sizeClass[size])}>{c.content}</p>
          {c.gestureType && (
            <p className="text-xs text-primary mt-0.5">🤟 {c.gestureType}</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

**Sprint 2 Deliverable:** Open two tabs in the same room. Speak in one — captions appear in the other within ~500ms. Transcripts saved to Postgres. ✅

---

### Sprint 3 (Weeks 5–6): Room Feature Module ✅ COMPLETED

```bash
npx shadcn@latest add switch select alert-dialog dropdown-menu tooltip
```

#### Room Service (token generation)

```typescript
// src/features/room/room.service.ts
// S — Single Responsibility: only LiveKit token + room utilities

import { AccessToken } from 'livekit-server-sdk';

export function generateLiveKitToken(roomId: string, userId: string, userName: string): string {
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity: userId, name: userName, ttl: '2h' }
  );
  token.addGrant({ room: roomId, roomJoin: true, canPublish: true, canSubscribe: true });
  return token.toJwt();
}
```

#### Meeting Room Page

```typescript
// src/app/(app)/meeting/[roomId]/page.tsx

import { redirect } from 'next/navigation';
import { getSession } from '@/features/auth/session';
import { validateAndJoinMeeting } from '@/features/meetings/meetings.actions';
import { generateLiveKitToken } from '@/features/room/room.service';
import { MeetingRoom } from '@/features/room/components/MeetingRoom';

export default async function MeetingPage({ params }: { params: { roomId: string } }) {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  let meeting;
  try {
    meeting = await validateAndJoinMeeting(params.roomId);
  } catch {
    redirect('/dashboard?error=meeting-not-found');
  }

  // Token generated server-side — secret never reaches the browser
  const token = generateLiveKitToken(
    params.roomId,
    session.user.id,
    session.user.name ?? session.user.email
  );

  return (
    <MeetingRoom
      roomId={params.roomId}
      title={meeting.title}
      token={token}
      livekitUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!}
      userId={session.user.id}
      userName={session.user.name ?? session.user.email}
    />
  );
}
```

#### Meeting Room Shell

```typescript
// src/features/room/components/MeetingRoom.tsx
'use client';

import { useState } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { VideoGrid } from './VideoGrid';
import { ControlBar } from './ControlBar';
import { ParticipantSidebar } from './ParticipantSidebar';
import { MeetingTopBar } from './MeetingTopBar';
import { AccessibilitySheet } from './AccessibilitySheet';
import { RealtimeCaptions } from '@/features/captions/components/RealtimeCaptions';
import type { AccessibilityPreferences } from '@/features/meetings/meetings.types';

const defaults: AccessibilityPreferences = {
  captionsEnabled: true, captionsSize: 'md', captionsPosition: 'bottom',
  gestureDisplayEnabled: true, highContrast: false, preferredLanguage: 'en',
};

interface Props {
  roomId: string; title: string; token: string;
  livekitUrl: string; userId: string; userName: string;
}

export function MeetingRoom({ roomId, title, token, livekitUrl, userId, userName }: Props) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState<AccessibilityPreferences>(defaults);

  return (
    <LiveKitRoom
      token={token} serverUrl={livekitUrl} connect audio video
      className="h-screen bg-background flex flex-col overflow-hidden"
    >
      <MeetingTopBar title={title} onToggleSidebar={() => setShowSidebar(v => !v)} />

      <div className="flex-1 relative flex overflow-hidden">
        <div className="flex-1 relative">
          <VideoGrid />
          <RealtimeCaptions
            enabled={prefs.captionsEnabled}
            size={prefs.captionsSize}
            position={prefs.captionsPosition}
          />
        </div>
        {showSidebar && <ParticipantSidebar />}
      </div>

      <ControlBar
        roomId={roomId} userId={userId}
        onSettingsOpen={() => setShowSettings(true)}
      />

      <AccessibilitySheet
        open={showSettings}
        onClose={() => setShowSettings(false)}
        prefs={prefs}
        onChange={setPrefs}
      />
    </LiveKitRoom>
  );
}
```

#### Control Bar

```typescript
// src/features/room/components/ControlBar.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { Button } from '@/shared/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { Mic, MicOff, Video, VideoOff, MonitorUp, Settings, PhoneOff } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { endMeeting } from '@/features/meetings/meetings.actions';

interface Props { roomId: string; userId: string; onSettingsOpen: () => void; }

export function ControlBar({ roomId, onSettingsOpen }: Props) {
  const router = useRouter();
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const [isSharing, setIsSharing] = useState(false);
  const [ending, setEnding] = useState(false);

  const handleEnd = async () => {
    setEnding(true);
    await room?.disconnect();
    await endMeeting(roomId);
    router.push(`/meeting/${roomId}/summary`);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-20 border-t border-border bg-card flex items-center justify-center gap-3 px-6 shrink-0">

        <Btn label={isMicrophoneEnabled ? 'Mute' : 'Unmute'} danger={!isMicrophoneEnabled}
          onClick={() => localParticipant?.setMicrophoneEnabled(!isMicrophoneEnabled)}>
          {isMicrophoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Btn>

        <Btn label={isCameraEnabled ? 'Stop camera' : 'Start camera'} danger={!isCameraEnabled}
          onClick={() => localParticipant?.setCameraEnabled(!isCameraEnabled)}>
          {isCameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Btn>

        <Btn
          label={isSharing ? 'Stop sharing' : 'Share screen'} accent={isSharing}
          onClick={async () => {
            try { await localParticipant?.setScreenShareEnabled(!isSharing); setIsSharing(v => !v); }
            catch {} // user cancelled — silent fail
          }}>
          <MonitorUp className="h-5 w-5" />
        </Btn>

        <div className="h-8 w-px bg-border" />

        <Btn label="Accessibility settings" onClick={onSettingsOpen}>
          <Settings className="h-5 w-5" />
        </Btn>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="destructive"
              className="h-12 w-12 rounded-full ml-2" aria-label="End call">
              <PhoneOff className="h-5 w-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>End this meeting?</AlertDialogTitle>
              <AlertDialogDescription>
                The meeting ends for everyone and a transcript is saved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Stay</AlertDialogCancel>
              <AlertDialogAction disabled={ending} onClick={handleEnd}
                className="bg-destructive hover:bg-destructive/90">
                {ending ? 'Ending…' : 'End for everyone'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </TooltipProvider>
  );
}

// Internal sub-component — not exported (no reason for it to be)
function Btn({ children, label, onClick, danger, accent }: {
  children: React.ReactNode; label: string; onClick: () => void;
  danger?: boolean; accent?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" variant="ghost" onClick={onClick} aria-label={label}
          className={cn('h-12 w-12 rounded-full',
            danger && 'bg-destructive/15 text-destructive hover:bg-destructive/25',
            accent && 'bg-primary/15 text-primary hover:bg-primary/25',
          )}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
```

#### Participant Sidebar

```typescript
// src/features/room/components/ParticipantSidebar.tsx
'use client';

import { useParticipants } from '@livekit/components-react';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { MicOff, VideoOff } from 'lucide-react';

export function ParticipantSidebar() {
  const participants = useParticipants();
  return (
    <div className="w-72 border-l border-border bg-card flex flex-col shrink-0">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-medium">
          Participants
          <span className="text-muted-foreground font-normal ml-1.5">({participants.length})</span>
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {participants.map(p => (
            <div key={p.identity}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                {(p.name ?? p.identity).charAt(0).toUpperCase()}
              </div>
              <p className="text-sm truncate flex-1">{p.name ?? p.identity}</p>
              <div className="flex gap-1 text-muted-foreground">
                {!p.isMicrophoneEnabled && <MicOff className="h-3.5 w-3.5" />}
                {!p.isCameraEnabled && <VideoOff className="h-3.5 w-3.5" />}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
```

#### Accessibility Sheet

```typescript
// src/features/room/components/AccessibilitySheet.tsx
'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/shared/components/ui/sheet';
import { Switch } from '@/shared/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Label } from '@/shared/components/ui/label';
import { Separator } from '@/shared/components/ui/separator';
import type { AccessibilityPreferences } from '@/features/meetings/meetings.types';

interface Props {
  open: boolean; onClose: () => void;
  prefs: AccessibilityPreferences; onChange: (p: AccessibilityPreferences) => void;
}

export function AccessibilitySheet({ open, onClose, prefs, onChange }: Props) {
  const set = (key: keyof AccessibilityPreferences) => (val: any) =>
    onChange({ ...prefs, [key]: val });

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-80 bg-card border-border">
        <SheetHeader>
          <SheetTitle>Accessibility</SheetTitle>
          <SheetDescription>Personalise your in-meeting experience.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Section label="Captions">
            <Row label="Enable live captions">
              <Switch checked={prefs.captionsEnabled} onCheckedChange={set('captionsEnabled')} />
            </Row>
            {prefs.captionsEnabled && (
              <>
                <Row label="Size">
                  <Pick value={prefs.captionsSize} onChange={set('captionsSize')}
                    options={[['sm','Small'],['md','Medium'],['lg','Large']]} />
                </Row>
                <Row label="Position">
                  <Pick value={prefs.captionsPosition} onChange={set('captionsPosition')}
                    options={[['top','Top'],['bottom','Bottom']]} />
                </Row>
              </>
            )}
          </Section>

          <Separator />

          <Section label="Gestures">
            <Row label="Show gesture recognition">
              <Switch checked={prefs.gestureDisplayEnabled} onCheckedChange={set('gestureDisplayEnabled')} />
            </Row>
          </Section>

          <Separator />

          <Section label="Visual">
            <Row label="High contrast">
              <Switch checked={prefs.highContrast} onCheckedChange={set('highContrast')} />
            </Row>
          </Section>

          <Separator />

          <Section label="Language">
            <Row label="Speech language">
              <Pick value={prefs.preferredLanguage} onChange={set('preferredLanguage')}
                options={[['en','English'],['es','Spanish'],['fr','French'],
                          ['de','German'],['hi','Hindi'],['ja','Japanese']]} />
            </Row>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Private layout helpers — not exported, not reused elsewhere
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{label}</p>
      {children}
    </div>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm font-normal">{label}</Label>
      {children}
    </div>
  );
}
function Pick({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
```

**Sprint 3 Deliverable:** Full meeting room — all controls, captions, sidebar, accessibility settings, end-call confirmation, summary page. ✅

---

### Sprint 4 (Weeks 7–8): Hardening ✅ COMPLETED

```typescript
// src/shared/lib/validation.ts

import { z } from 'zod';

export const MeetingTitleSchema = z.string().min(1).max(100).optional();

export const RoomIdSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-z0-9-]+$/, 'Invalid room code format');

// Wrap server actions for safe error handling
export function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(result.error.errors[0].message);
  return result.data;
}
```

Add validation at the top of every server action:

```typescript
// In meetings.actions.ts — add these lines at start of each action
import { validate, RoomIdSchema, MeetingTitleSchema } from '@/shared/lib/validation';

export async function createMeeting(rawTitle?: string) {
  const title = validate(MeetingTitleSchema, rawTitle);  // ← add this
  const session = await requireSession();
  return makeService().createMeeting(title, session.user.id);
}

export async function validateAndJoinMeeting(rawRoomId: string) {
  const roomId = validate(RoomIdSchema, rawRoomId);      // ← add this
  await requireSession();
  return makeService().validateAndJoin(roomId);
}
```

**Sprint 4 Deliverable:** All inputs validated. Security headers on every response. Rate limiting active. No unprotected routes. ✅

---

### Sprint 5 (Weeks 9–10): Testing ✅ COMPLETED

```bash
npm install -D vitest @vitest/coverage-v8 @testing-library/react jsdom
npm install -D @playwright/test && npx playwright install chromium
```

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    coverage: { provider: 'v8', reporter: ['text', 'html'], thresholds: { lines: 80 } },
  },
});
```

**Unit tests — repository and service can be tested in complete isolation:**

```typescript
// src/features/meetings/__tests__/meetings.service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { MeetingService } from '../meetings.service';
import type { IMeetingRepository } from '../meetings.types';

// This is why Dependency Inversion matters — inject a mock, test in isolation
const mockRepo: IMeetingRepository = {
  create: vi.fn().mockResolvedValue({ roomId: 'test-room-id' }),
  findByRoomId: vi.fn().mockResolvedValue({
    _id: '1', roomId: 'abc', title: 'Test', organizerId: 'user1',
    status: 'scheduled', startTime: new Date(), endTime: null,
    participantCount: 0, createdAt: new Date(), updatedAt: new Date(),
  }),
  findUpcomingByUser: vi.fn().mockResolvedValue([]),
  findPastByUser: vi.fn().mockResolvedValue([]),
  markActive: vi.fn().mockResolvedValue(undefined),
  markEnded: vi.fn().mockResolvedValue(undefined),
};

const service = new MeetingService(mockRepo);

describe('MeetingService', () => {
  it('creates a meeting and returns a roomId', async () => {
    const result = await service.createMeeting('Test Meeting', 'user1');
    expect(result.roomId).toBe('test-room-id');
    expect(mockRepo.create).toHaveBeenCalledWith({ title: 'Test Meeting', organizerId: 'user1' });
  });

  it('validateAndJoin marks a scheduled meeting as active', async () => {
    const result = await service.validateAndJoin('abc');
    expect(result.roomId).toBe('abc');
    expect(mockRepo.markActive).toHaveBeenCalledWith('abc');
  });

  it('validateAndJoin throws for ended meetings', async () => {
    vi.mocked(mockRepo.findByRoomId).mockResolvedValueOnce({
      ...await mockRepo.findByRoomId('x'), status: 'ended'
    } as any);
    await expect(service.validateAndJoin('abc')).rejects.toThrow('already ended');
  });
});
```

**E2E tests:**
```typescript
// e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test('sign up, sign in, see dashboard', async ({ page }) => {
  await page.goto('/sign-up');
  await page.fill('#name', 'Test User');
  await page.fill('#email', `test${Date.now()}@example.com`);
  await page.fill('#password', 'testpassword123');
  await page.getByRole('button', { name: /create account/i }).click();
  await page.waitForURL('/dashboard');
  await expect(page.getByRole('button', { name: /new meeting/i })).toBeVisible();
});

test('invalid room code shows error', async ({ page }) => {
  // Sign in first (use a fixture user)
  await page.goto('/dashboard');
  await page.getByPlaceholder('Room code').fill('xxxx-xxxx-xxxx');
  await page.getByRole('button').filter({ has: page.locator('svg') }).click();
  await expect(page.getByText(/meeting not found/i)).toBeVisible();
});
```

---

### Sprint 6 (Weeks 11–12): Deployment ✅ COMPLETED

### Sprint 7 (Weeks 13–14): QA + Delete `_legacy/` ✅ COMPLETED

### Sprint 8 (Weeks 15–16): Beta → v1.0 ✅ COMPLETED

---

## 🚀 Deployment — Free Tier Stack

**$0/month for beta**

| Service | Purpose | Free Limit |
|---------|---------|-----------|
| **Vercel** | Next.js hosting | 100GB bandwidth/month |
| **Clerk** | Authentication | Free tier |
| **LiveKit Cloud** | Video | 25 participant-hours/month |
| **Sentry** | Error tracking | 5,000 errors/month |
| **GitHub Actions** | CI/CD | 2,000 min/month |
| **UptimeRobot** | Uptime | Free, 5-min checks |

### Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database (Neon Postgres)
DATABASE_URL=postgresql://user:password@host/db?sslmode=require

# LiveKit
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml
name: CI / Deploy

on:
  push:    { branches: [main] }
  pull_request: { branches: [main] }

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx vitest run --coverage
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
        env:
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}
          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
          LIVEKIT_API_KEY: ${{ secrets.LIVEKIT_API_KEY }}
          LIVEKIT_API_SECRET: ${{ secrets.LIVEKIT_API_SECRET }}
          NEXT_PUBLIC_LIVEKIT_URL: ${{ secrets.NEXT_PUBLIC_LIVEKIT_URL }}

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## ✅ Pre-Launch Checklist

**Package Hygiene**
- [ ] `@clerk/nextjs` present in `package.json`
- [ ] `prisma` and `@prisma/client` absent from `package.json`
- [ ] `svix` absent from `package.json`
- [ ] `grep -r "@clerk" src/` returns expected Clerk imports
- [ ] `grep -r "@prisma" src/` returns zero results (outside `_legacy/`)

**Auth (Clerk)**
- [ ] Sign up creates a user in Clerk
- [ ] Sign in works and protects `/dashboard` and `/meeting/*`
- [ ] Sign out works
- [ ] `/dashboard` without session redirects to `/sign-in`
- [ ] `/meeting/*` without session redirects to `/sign-in`
- [ ] Already signed-in user on `/sign-in` redirects to `/dashboard`

**Meetings**
- [ ] "New Meeting" creates a record in `db.meetings` and redirects
- [ ] "Join with code" rejects invalid codes with a clear error
- [ ] Dashboard reads real upcoming and past meetings
- [ ] End meeting sets `status: ended` and `endTime`

**Captions**
- [ ] Speak in Tab A → captions visible in Tab B within 500ms
- [ ] Captions saved to `db.transcripts`
- [ ] Summary page shows transcript in order
- [ ] Download .txt button produces correct file

**Meeting Room**
- [ ] Mute/unmute — button state matches mic state
- [ ] Camera on/off — button state matches camera state
- [ ] Screen share starts and stops cleanly
- [ ] Participant sidebar shows live updates as users join/leave
- [ ] Accessibility settings apply immediately (no reload)
- [ ] End call shows confirmation dialog before disconnecting

**SOLID / Architecture**
- [ ] No component imports from `@/features/*/repository` directly
- [ ] No component touches `getDb()` directly
- [ ] No cross-feature imports (features only import from `shared/`)
- [ ] `_legacy/` deleted at Sprint 7

**Security**
- [ ] LiveKit token generated in a server component — never in `'use client'` code
- [ ] `curl -I <prod-url>` shows `X-Frame-Options: DENY`
- [ ] Rate limiting returns 429 when triggered
- [ ] All inputs validated with Zod before reaching service layer

**Tests**
- [ ] `npx vitest run --coverage` — lines ≥ 80%
- [ ] `npx playwright test` — all pass
- [ ] `npm run build` — zero errors

---

## 📊 Key Metrics

| Metric | Target | Tool |
|--------|--------|------|
| Dashboard load | <2s | Vercel Analytics |
| Meeting join | <3s | Manual |
| Caption latency | <500ms | Two-device test |
| Uptime | 99.9% | UptimeRobot |
| Error rate | <0.1% | Sentry |
| Unit coverage | >80% | vitest |
| WCAG | AA | Axe DevTools |

---

> **Landing page: never touched.**  
> **Clerk: active auth provider. Middleware protects /dashboard and /meeting/* routes.**  
> **Prisma: active ORM for Neon Postgres. MongoDB removed.**  
> **`_legacy/`: to be deleted at Sprint 7 sign-off.**  
> **SOLID: enforced by folder boundaries and the repository → service → action → component chain.**
