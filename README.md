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
| **Database** | PostgreSQL (Supabase) via Prisma ORM |
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
├── render.yaml                # Render.com deployment config
├── public/_redirects          # Cloudflare Pages SPA routing
└── .env.example               # Environment variables template
```

---

## Local Development

### Prerequisites
- Node.js 20+
- A free [Supabase](https://supabase.com) account (for the database)

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
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
JWT_SECRET=<64-char random string>
JWT_REFRESH_SECRET=<64-char random string>
APP_ORIGIN=http://localhost:3000
```

> **Generate secrets:** `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 4. Migrate the database

```bash
npm run prisma:migrate:dev
```

### 5. Start

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)**

---

## Deployment — 100% Free

This project is designed to run entirely on free tiers across three platforms:

```
Cloudflare Pages  ──► Render.com Backend  ──► Supabase (PostgreSQL)
   (Frontend)            (API + WS)              (Database)
```

---

### 1️⃣ Supabase — Database

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new **project** (pick a region near your users)
3. Go to **Settings → Database → Connection string → URI**
4. Copy the connection string — save it as `DATABASE_URL`

> **Free tier:** 500MB storage · 5GB bandwidth · 50,000 monthly users

---

### 2️⃣ Render.com — Backend API + WebSockets

1. Sign up at [render.com](https://render.com) with your GitHub account
2. Click **New → Web Service** and connect this repository
3. Render auto-detects `render.yaml` and configures the service
4. Set the following **Environment Variables** in the Render dashboard:

| Variable | Value |
|---|---|
| `DATABASE_URL` | *(paste from Supabase)* |
| `JWT_SECRET` | *(generate a 64-char random string)* |
| `JWT_REFRESH_SECRET` | *(generate another 64-char random string)* |
| `APP_ORIGIN` | *(your Cloudflare Pages URL — set after step 3)* |

5. Click **Create Web Service** — your backend URL will be `https://samjho-backend.onrender.com`

> **Free tier caveat:** Spins down after 15 min of inactivity (~60s cold start on first wake). Use [UptimeRobot](https://uptimerobot.com) (free) to ping `https://YOUR-RENDER-URL/health` every 5 min.

---

### 3️⃣ Cloudflare Pages — Frontend

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Click **Create a project → Connect to Git** and select this repository
3. Configure the build:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |

4. Add this **Environment Variable** in the Pages settings:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://samjho-backend.onrender.com` |

5. Click **Save and Deploy** — your app will be live at `https://samjho.pages.dev`
6. **Go back to Render** and update `APP_ORIGIN` to your Cloudflare Pages URL

> **Free tier:** Unlimited bandwidth · Unlimited requests · Global CDN

---

### 4️⃣ Keep the Backend Warm (Recommended)

1. Create a free account at [uptimerobot.com](https://uptimerobot.com)
2. Add a new **HTTP(S) Monitor**:
   - URL: `https://YOUR-RENDER-URL/health`
   - Interval: **5 minutes**

This prevents cold starts keeping your server awake 24/7 at zero cost.

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
