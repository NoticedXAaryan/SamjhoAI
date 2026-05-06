<div align="center">

<h1>🤟 Samjho AI</h1>

<p><strong>Accessible Video Conferencing — Built for Everyone</strong></p>

<p>Real-time sign language recognition · Live AI translation · Meeting transcription</p>

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://typescriptlang.org)

</div>

---

## What is Samjho AI?

**Samjho** is an accessible, real-time video conferencing platform designed to break down communication barriers for the deaf, hard-of-hearing, and multilingual communities.

Our goal is to build a highly usable, real-world ready system that makes communication seamless across different abilities.

| Feature | Description |
|---|---|
| 🤟 **Sign Language Recognition** | Computer vision detects and interprets hand gestures and signs from your webcam |
| 🌐 **Live Translation** | Speech and sign-language input are translated on-the-fly between participants |
| 📝 **Live Transcription** | Every word spoken or signed is transcribed into captions with a full session transcript |
| 🎥 **HD Video Meetings** | Host, schedule, and join meetings with mic, camera, screen share, and grid layouts |
| 🔐 **Modern Auth** | Secure, out-of-the-box user management |

---

## 🏗️ The Tech Stack (Current Direction)

We are currently migrating from a custom Express/Socket.io backend to a modern, unified Next.js stack to make development easier, deployment seamless, and to create a production-ready application.

| Layer | Technology | Why we use it |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Unified frontend and backend API, easy deployment, React Server Components. |
| **Authentication** | Clerk | Production-ready, secure user management out-of-the-box. Replaces custom JWT logic. |
| **Video Engine** | LiveKit | Replaces raw WebRTC. Handles robust multi-party video, screen sharing, and real-time data broadcasting effortlessly. |
| **Styling** | Tailwind CSS v4, Motion | Beautiful, responsive, accessible UI components. |
| **Database** | Prisma + Neon Postgres | Serverless Postgres database, interacted with via Next.js Server Actions. |
| **AI / Accessibility**| MediaPipe & Web Speech | Client-side computer vision for gesture detection and speech-to-text. |

---

## 🚀 Current State & Next Steps

The project is currently transitioning to its new unified Next.js architecture.

### Immediate Focus Areas (To make it Real-World Ready):
1. **Solidify Authentication:** Fully integrate Clerk for sign-up, sign-in, and protecting dashboard routes.
2. **Robust Video Conferencing:** Implement LiveKit to enable reliable video calls, fixing issues with screen sharing and connection drops that existed in the old raw WebRTC implementation.
3. **Real-time Captions:** Move MediaPipe to a Web Worker to keep the UI smooth, and use LiveKit's Data Channels to broadcast speech and sign language captions instantly to all participants.
4. **Meeting Management:** Connect Prisma inside Next.js Server Actions to handle creating, joining, and saving meeting history.

For a detailed, step-by-step breakdown of how we are getting there, see the [ROADMAP.md](./ROADMAP.md).

---

## 📚 Comprehensive Documentation

### Production Readiness Status: **35% → Target 95%**

We've completed a full audit of the codebase and created a detailed roadmap to production readiness.

| Document | Purpose |
|----------|---------|
| **[`ROADMAP.md`](./ROADMAP.md)** | 12–16 week sprint-by-sprint plan with 8 sprints to reach 95% production readiness |
| **[`IMPROVEMENTS.md`](./IMPROVEMENTS.md)** | Comprehensive audit results, all identified improvements, detailed technical implementation code, and architecture decisions |
| **[`PROJECT_BRIEF.md`](./PROJECT_BRIEF.md)** | Original project vision, goals, and problem statement |

### Quick Navigation

**Just getting started?**  
→ Read [`ROADMAP.md`](./ROADMAP.md) for the high-level plan and sprint breakdown.

**Ready to implement?**  
→ Read [`IMPROVEMENTS.md`](./IMPROVEMENTS.md) for detailed technical specs, code samples, and architecture decisions.

**Key Findings from the Audit:**
- ✅ **Strengths:** Solid auth foundation (Clerk), video infrastructure (LiveKit), modern stack (Next.js 15, TypeScript)
- ❌ **Critical Issues:** Captions detected locally but never broadcast to other participants (defeats core value), meetings not persistent, video controls missing, dual database causing confusion
- 🎯 **Fixes:** Database consolidation → Real-time caption broadcasting → Video controls → Backend hardening → Testing & deployment

---

## Local Development

### Prerequisites
- Node.js 20+
- A PostgreSQL database (e.g. [Neon](https://neon.tech))
- A [Clerk](https://clerk.com) account (for Auth)
- A [LiveKit](https://livekit.io) cloud project (for Video)

### 1. Clone & Install
```bash
git clone https://github.com/NoticedXAaryan/SamjhoAI.git
cd SamjhoAI
npm install
```

### 2. Configure Environment
Create a `.env.local` file based on `.env.example`:
```bash
cp .env.example .env.local
```

Add your keys:
```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_WEBHOOK_SECRET=whsec_...

# Database (Neon Postgres)
DATABASE_URL=postgresql://user:password@host/db?sslmode=require

# LiveKit
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
NEXT_PUBLIC_LIVEKIT_URL=wss://...
```

> Note: if your browser is connecting from a custom host IP during development, ensure `172.17.16.1` is added to `allowedDevOrigins` in `next.config.ts`.

### 3. Sync Database & Start
```bash
npx prisma db push
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)**

---

## License

**All Rights Reserved — Proprietary Software**

This project is **not open source**. No license is granted to use, copy, modify, distribute, or deploy this software without explicit written permission from the author.

📧 **Permissions & inquiries:** [Noticedxaaryan@gmail.com](mailto:Noticedxaaryan@gmail.com)
