<div align="center">

<h1>🤟 Samjho</h1>

<p><strong>Accessible Video Conferencing — Built for Everyone</strong></p>

<p>Real-time sign language recognition · Live AI translation · Meeting transcription</p>

<br/>

[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://typescriptlang.org)

</div>

---

> ⚠️ **Proprietary Software — All Rights Reserved**
> Any use, modification, or distribution requires **written approval** from the author.
> 📧 [Noticedxaaryan@gmail.com](mailto:Noticedxaaryan@gmail.com) · See [LICENSE](./LICENSE)

---

## What is Samjho?

**Samjho** is an accessible, real-time video conferencing platform designed to break down communication barriers for the deaf, hard-of-hearing, and multilingual communities.

| Feature | Description |
|---|---|
| 🤟 **Sign Language Recognition** | Computer vision detects and interprets hand gestures and ASL/ISL signs from your webcam in real time |
| 🌐 **Live Translation** | Speech and sign-language input are translated on-the-fly between participants |
| 📝 **Live Transcription** | Every word spoken or signed is transcribed into captions with a full session transcript |
| 🎥 **HD Video Meetings** | Host, schedule, and join meetings with mic, camera, screen share, hand raise, and multi-layout grid |
| 📅 **Dashboard & Scheduler** | Schedule upcoming meetings, generate shareable links, and view meeting history |
| 🔐 **Secure Auth** | JWT-based authentication with access + refresh tokens |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Framer Motion, GSAP |
| **Backend** | Node.js, Express, Socket.io |
| **Database** | PostgreSQL (Neon or Render) via Prisma ORM |
| **Real-time** | Socket.io WebSocket signaling + WebRTC peer video |
| **Auth** | JWT (access + refresh tokens), bcrypt |
| **Build** | Vite 6, tsx |

---

## Project Structure

```
samjho/
├── src/
│   ├── backend/               # Express API + Socket.io
│   │   ├── config/env.ts      # Environment validation (Zod)
│   │   ├── lib/               # Prisma client, JWT helpers
│   │   ├── middleware/        # Auth middleware
│   │   ├── routes/            # auth.ts, meetings.ts
│   │   └── socket/            # Real-time handlers + WebRTC signaling
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Frontend utilities + API client
│   ├── pages/                 # Landing, Auth, Dashboard, Meeting
│   └── store/                 # Zustand global state
├── schema.prisma              # Database schema (User, Meeting, Participant, Message)
├── server.ts                  # Dev server (Vite + Express unified)
├── render.yaml                # Render.com deployment config (Blueprint)
└── .env.example               # Environment variables template
```

---

## Local Development

### Prerequisites
- Node.js 20+
- A PostgreSQL database (e.g. [Neon](https://neon.tech) or [Render PostgreSQL](https://render.com/docs/databases))

### 1. Clone

```bash
git clone https://github.com/NoticedXAaryan/SamjhoAI.git
cd SamjhoAI
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
JWT_SECRET=<64-char random string>
JWT_REFRESH_SECRET=<64-char random string>
```

> **Generate secrets:** `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 4. Sync the database

```bash
npx prisma db push
```

### 5. Start

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)**

---

## Deployment

The entire app (frontend + backend) deploys as a **single Node.js service on Render.com**:

```
Render Web Service (Node.js)
├── Vite-built React frontend (served as static)
├── Express API + Socket.IO server
└── Render PostgreSQL (free tier)
```

### Quick Deploy

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New +** → **Blueprint Instance**
3. Select this repository — `render.yaml` is auto-detected
4. Fill in `JWT_SECRET` and `JWT_REFRESH_SECRET` (generate with the command above)
5. Click **Apply** — Render creates the web service + PostgreSQL database automatically

That's it. One URL, everything works — auth, meetings, WebRTC, and chat.

> **Free tier caveat:** The web service spins down after 15 min of inactivity (~50s cold start). Free PostgreSQL databases also sleep. Use [UptimeRobot](https://uptimerobot.com) (free) to ping `https://YOUR-RENDER-URL/health` every 5 min.

---

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | No | Auto-set to `production` by Render |
| `DATABASE_URL` | Yes | Auto-set from Render PostgreSQL |
| `JWT_SECRET` | Yes | Min 32 chars — signs access tokens |
| `JWT_REFRESH_SECRET` | Yes | Min 32 chars — signs refresh tokens |
| `APP_ORIGIN` | No | Auto-set from Render's external URL |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | No | Server port (default: `3000`) |
| `APP_ORIGIN` | Yes | Frontend URL — used for CORS |
| `DATABASE_URL` | Yes | PostgreSQL URI from Supabase |
| `JWT_SECRET` | Yes | Min 32 chars — signs access tokens |
| `JWT_EXPIRES_IN` | No | Access token TTL (default: `15m`) |
| `JWT_REFRESH_SECRET` | Yes | Min 32 chars — signs refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh token TTL (default: `7d`) |
| `VITE_API_URL` | Prod only | Backend URL — set in Cloudflare Pages |

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start unified dev server (Vite + Express) |
| `npm run build` | Build frontend for production |
| `npm run start` | Start production server |
| `npm run prisma:migrate:dev` | Run DB migrations (dev) |
| `npm run prisma:migrate:deploy` | Run DB migrations (prod) |
| `npm run prisma:studio` | Open Prisma Studio (DB GUI) |

---

## License

**All Rights Reserved — Proprietary Software**

This project is **not open source**. No license is granted to use, copy, modify, distribute, or deploy this software without explicit written permission from the author.

📧 **Permissions & inquiries:** [Noticedxaaryan@gmail.com](mailto:Noticedxaaryan@gmail.com)

Violations will be pursued to the fullest extent of applicable law. See [LICENSE](./LICENSE) for full terms.

---

<div align="center">
<sub>Samjho — Because every voice deserves to be heard.</sub>
</div>
