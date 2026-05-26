<div align="center">

# 🎨 First To Ten — Frontend

**React + Vite SPA for the real-time math duel game**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/TheShahnawaaz/FirstToTen&root=frontend)

</div>

---

## Overview

This is the frontend application for **First To Ten** — a multiplayer math game. It connects to a Socket.io backend to provide real-time gameplay, live opponent tracking, sound effects, and post-game analytics.

---

## 🗂️ Project Structure

```
frontend/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── components/
│   │   ├── NameEntry.jsx       # Login / name entry screen
│   │   ├── Matchmaker.jsx      # Matchmaking lobby
│   │   ├── GameDuel.jsx        # Core live game screen
│   │   ├── GameAnalysis.jsx    # Post-game stats & breakdown
│   │   └── VirtualNumpad.jsx   # Mobile-friendly numpad
│   ├── utils/
│   │   └── audio.js            # Web Audio API sound engine
│   ├── App.jsx                 # Root component, screen router
│   ├── App.css                 # Global styles & neon effects
│   ├── index.css               # Tailwind base & custom tokens
│   └── main.jsx                # Vite entry point
├── .env                        # Local env vars (gitignored)
├── .env.example                # Env template
├── index.html                  # Vite HTML entry
├── vite.config.js              # Vite configuration
└── eslint.config.js            # ESLint configuration
```

---

## 🚀 Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5050
VITE_GOOGLE_CLIENT_ID=your_google_client_id   # optional
```

### 3. Start the dev server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

> Make sure the backend is also running on port `5050`

---

## 🔧 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build for production (`dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## 🌍 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | URL of the backend Socket.io server |
| `VITE_GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID (optional) |

> All Vite env vars must be prefixed with `VITE_` to be accessible in the browser.

---

## 🧰 Tech Stack

| Library | Version | Purpose |
|---|---|---|
| [React](https://react.dev/) | 19 | UI framework |
| [Vite](https://vitejs.dev/) | 8 | Build tool & dev server |
| [Tailwind CSS](https://tailwindcss.com/) | v4 | Utility-first CSS |
| [Framer Motion](https://www.framer.com/motion/) | 12 | Animations & transitions |
| [Socket.io Client](https://socket.io/) | 4 | WebSocket connection |
| [Lucide React](https://lucide.dev/) | latest | Icons |
| [Recharts](https://recharts.org/) | 3 | Analytics charts |

---

## 🎨 Design System

The UI uses a **neon dark** aesthetic with:

- **Background:** Deep dark `#07080e`
- **Primary accent:** Cyan `#22d3ee`
- **Secondary accent:** Purple `#a855f7`
- **Glass cards:** `backdrop-blur` with semi-transparent borders
- **Neon text:** CSS text-shadow glows on key elements
- **Radial glows:** Large background blobs for depth

All animations use **Framer Motion** with `AnimatePresence` for smooth screen transitions and mount/unmount effects.

---

## 🚢 Deploy to Vercel

### Option A — Vercel CLI

```bash
npx vercel --cwd frontend
```

### Option B — Vercel Dashboard

1. Import the repo at [vercel.com/new](https://vercel.com/new)
2. Set **Root Directory** to `frontend`
3. Add the environment variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
4. Build settings are auto-detected from `package.json`

---

## 📡 Socket.io Connection

The app connects to the backend on load using:

```js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';
const socket = io(API_URL, {
  autoConnect: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000
});
```

The connection status is shown in the top-right corner of the UI.

---

## 📺 Screen Flow

```
NameEntry (AUTH)
     ↓ login
Matchmaker (LOBBY)
     ↓ match_found
GameDuel (GAME)
     ↓ game_over
GameAnalysis (ANALYSIS)
     ↓ restart
Matchmaker (LOBBY)
```

---

<div align="center">

Part of the [First To Ten](https://github.com/TheShahnawaaz/FirstToTen) monorepo.

*Auto-deployed via Vercel GitHub integration.*

</div>
