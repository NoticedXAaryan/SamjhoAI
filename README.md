<div align="center">

<h1>🤟 Samjho AI</h1>

<p><strong>Accessible Video Conferencing — Built for Everyone</strong></p>

<p>Self-hosted video meetings · Realtime captions · Chat and transcripts</p>

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://typescriptlang.org)

</div>

---

## What is Samjho AI?

**Samjho** is an accessible, real-time video conferencing platform designed to break down communication barriers for the deaf, hard-of-hearing, and multilingual communities.

Our goal is to build a highly usable, real-world ready system that makes communication seamless across different abilities.

| Feature | Description |
|---|---|
| 📝 **Live captions** | Browser speech recognition, reliable in-room caption broadcast, and host transcript export |
| 🎥 **Video meetings** | Prejoin preview, mic, camera, screen share, remote audio, grid layouts, chat, and participant list |
| 🔐 **Self-hosted auth** | Better Auth email/password accounts and sessions stored in PostgreSQL |
| 🤟 **Sign recognition** | Planned; the current release does not claim an implemented gesture-recognition model |
| 🌐 **Translation** | Planned after the reliable meeting baseline is complete |

---

## 🏗️ The Tech Stack (Current Direction)

Samjho AI is a unified **Next.js App Router** application designed for a self-hosted Docker/Dokploy deployment.

| Layer | Technology | Why we use it |
|---|---|---|
| **Framework** | Next.js (App Router) | Unified frontend and backend in one self-hosted container. |
| **Authentication** | Better Auth | Self-hosted auth (no MAU limits), email/password sessions. |
| **Video Engine** | LiveKit | Replaces raw WebRTC. Handles robust multi-party video, screen sharing, and real-time data broadcasting effortlessly. |
| **Styling** | Tailwind CSS v4, Motion | Beautiful, responsive, accessible UI components. |
| **Database** | Prisma + PostgreSQL | One self-hostable database for accounts, meetings, and transcripts. |
| **Realtime captions** | Web Speech + LiveKit Data | Speech-to-text in browser + broadcast to room + transcript persistence. |

---

## 🚀 Current State & Next Steps

### Current State (MVP)
- **Auth**: Better Auth sign-up/sign-in/sign-out
- **Meetings**: Create/join meetings, persisted to Postgres (Prisma)
- **Meeting room**: Prejoin device selection, LiveKit grid, remote audio, mic/cam/screen share controls, reconnection state, chat, and participants sidebar
- **Realtime captions**: Reliable, validated, topic-scoped LiveKit data messages plus transcript persistence
- **Summary**: `/meeting/[id]/summary` shows transcript and downloads `.txt`

For the full roadmap, see [`ROADMAP.md`](./ROADMAP.md).

---

## 📚 Comprehensive Documentation

The repository is being recovered in phases: deployable self-hosted foundation first, complete meeting reliability second, then advanced accessibility features.

| Document | Purpose |
|----------|---------|
| **[`ROADMAP.md`](./ROADMAP.md)** | 12–16 week sprint-by-sprint plan with 8 sprints to reach 95% production readiness |
| **[`PROJECT_BRIEF.md`](./PROJECT_BRIEF.md)** | Original project vision, goals, and problem statement |
| **[`deploy/SELF_HOSTING.md`](./deploy/SELF_HOSTING.md)** | Dokploy, networking, secrets, health checks, and backup guidance |

### Quick Navigation

**Just getting started?**  
→ Read [`ROADMAP.md`](./ROADMAP.md) for the high-level plan and sprint breakdown.

---

## Local Development

### Prerequisites
- Node.js 22+
- PostgreSQL 15+
- A self-hosted [LiveKit](https://livekit.io) server (the included Compose stack can run one)

### 1. Clone & Install
```bash
git clone https://github.com/NoticedXAaryan/SamjhoAI.git
cd SamjhoAI
npm ci
```

### 2. Configure Environment
Create a `.env.local` file based on `.env.example`:
```bash
cp .env.example .env.local
```

Add your keys:
```env
# App
# Better Auth
BETTER_AUTH_SECRET=your-long-random-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/samjho

# LiveKit
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
NEXT_PUBLIC_LIVEKIT_URL=wss://...
LIVEKIT_URL=https://...
```

> Note: if your browser is connecting from a custom host IP during development, ensure `172.17.16.1` is added to `allowedDevOrigins` in `next.config.ts`.

### 3. Sync Database & Start
```bash
npx prisma migrate deploy
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)**

---

## Deploy on Dokploy

The repository includes a production `Dockerfile`, health endpoints, Prisma migrations, and `compose.self-hosted.yml` for the application, PostgreSQL, Redis, and LiveKit. See [`deploy/SELF_HOSTING.md`](./deploy/SELF_HOSTING.md) for domains, secrets, ports, backups, and verification.

---

## License

**All Rights Reserved — Proprietary Software**

This project is **not open source**. No license is granted to use, copy, modify, distribute, or deploy this software without explicit written permission from the author.

📧 **Permissions & inquiries:** [Noticedxaaryan@gmail.com](mailto:Noticedxaaryan@gmail.com)
