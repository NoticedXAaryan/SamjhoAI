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

Samjho AI is now a unified **Next.js App Router** application with a serverless-friendly architecture for deployment on Vercel.

| Layer | Technology | Why we use it |
|---|---|---|
| **Framework** | Next.js (App Router) | Unified frontend + backend, edge/serverless deployment, great DX. |
| **Authentication** | Better Auth | Self-hosted auth (no MAU limits), email/password sessions. |
| **Video Engine** | LiveKit | Replaces raw WebRTC. Handles robust multi-party video, screen sharing, and real-time data broadcasting effortlessly. |
| **Styling** | Tailwind CSS v4, Motion | Beautiful, responsive, accessible UI components. |
| **Database** | Prisma + Neon Postgres | Serverless Postgres database, interacted with via Next.js Server Actions. |
| **Realtime captions** | Web Speech + LiveKit Data | Speech-to-text in browser + broadcast to room + transcript persistence. |

---

## 🚀 Current State & Next Steps

### Current State (MVP)
- **Auth**: Better Auth sign-up/sign-in/sign-out
- **Meetings**: Create/join meetings, persisted to Postgres (Prisma)
- **Meeting room**: LiveKit grid + mic/cam/screen share controls + participants sidebar
- **Realtime captions**: Broadcast via LiveKit data messages + saved transcript
- **Summary**: `/meeting/[id]/summary` shows transcript and downloads `.txt`

For the full roadmap, see [`ROADMAP.md`](./ROADMAP.md).

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
- ✅ **Strengths:** Self-hosted auth (Better Auth), video infrastructure (LiveKit), modern stack (Next.js, TypeScript)
- ❌ **Critical Issues:** Captions detected locally but never broadcast to other participants (defeats core value), meetings not persistent, video controls missing, dual database causing confusion
- 🎯 **Fixes:** Database consolidation → Real-time caption broadcasting → Video controls → Backend hardening → Testing & deployment

---

## Local Development

### Prerequisites
- Node.js 20+
- A PostgreSQL database (e.g. [Neon](https://neon.tech))
- A MongoDB database (e.g. MongoDB Atlas) for Better Auth
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
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Better Auth
BETTER_AUTH_SECRET=your-long-random-secret-min-32-chars

# MongoDB (Better Auth)
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=samjhoai

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

## Deploy on Vercel

1. Import the GitHub repo into Vercel (framework auto-detects **Next.js**).
2. Set these environment variables in Vercel:
   - `NEXT_PUBLIC_APP_URL` = `https://<your-vercel-domain>`
   - `BETTER_AUTH_SECRET` = strong random secret (32+ chars)
   - `MONGODB_URI` and optional `MONGODB_DB_NAME`
   - `DATABASE_URL` (Neon Postgres)
   - `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL`
3. Deploy.

---

## License

**All Rights Reserved — Proprietary Software**

This project is **not open source**. No license is granted to use, copy, modify, distribute, or deploy this software without explicit written permission from the author.

📧 **Permissions & inquiries:** [Noticedxaaryan@gmail.com](mailto:Noticedxaaryan@gmail.com)
