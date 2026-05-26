<div align="center">

# ⚡ First To Ten

### Real-Time Multiplayer Mathematics Arena

**A fast-paced 1v1 math duel game. First player to correctly solve 10 rounds wins.**

[![Frontend](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel)](https://first-to-ten.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)](https://first-to-ten-backend.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-TheShahnawaaz-181717?style=for-the-badge&logo=github)](https://github.com/TheShahnawaaz/FirstToTen)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## 📖 Overview

**First To Ten** is a real-time multiplayer math game where two players are matched and compete head-to-head answering math questions as fast as possible. The first player to win **10 rounds** claims victory.

Each round features:
- A **10-second countdown timer**
- A randomly generated **math question** (addition, subtraction, multiplication, division)
- Instant feedback on correct/incorrect answers
- Live **opponent typing indicators**
- A **post-game analysis screen** with detailed performance stats

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔌 **Real-time WebSockets** | Powered by Socket.io — zero polling, instant events |
| 🎯 **Matchmaking Queue** | Auto-pairs players as soon as two are waiting |
| ⌚ **Live Timer** | 10-second per-round countdown with animated circular progress |
| 👁️ **Opponent Typing Indicator** | Real-time "Typing..." bubble when opponent is entering an answer |
| 🎵 **Sound Effects** | Audio cues for correct answers, wrong attempts, victory, and defeat |
| 📊 **Game Analysis** | Post-match breakdown with accuracy, speed, and round-by-round history |
| 📱 **Virtual Numpad** | Mobile-friendly on-screen number pad |
| 🎨 **Neon Dark UI** | Stunning glassmorphism design with cyan/purple neon accents |
| ⚡ **Forfeit & Reconnect** | Graceful disconnect handling and opponent-left detection |

---

## 🏗️ Architecture

```
FirstToTen/
├── backend/          # Node.js + Express + Socket.io game server
│   ├── server.js     # HTTP + WebSocket server entry point
│   ├── gameManager.js # Matchmaking queue & room lifecycle
│   ├── room.js       # Per-game room logic, scoring, timers
│   ├── .env          # Environment variables (gitignored)
│   └── .env.example  # Environment variable template
│
├── frontend/         # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx              # Root component & screen router
│   │   ├── components/
│   │   │   ├── NameEntry.jsx    # Anonymous login screen
│   │   │   ├── Matchmaker.jsx   # Queue lobby screen
│   │   │   ├── GameDuel.jsx     # Live game screen
│   │   │   ├── GameAnalysis.jsx # Post-game stats screen
│   │   │   └── VirtualNumpad.jsx # Mobile-friendly numpad
│   │   └── utils/audio.js       # Web Audio API sound engine
│   ├── .env          # Vite env vars (gitignored)
│   └── .env.example  # Vite env var template
│
└── package.json      # Monorepo root scripts
```

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm v9+

### 1. Clone the repository

```bash
git clone https://github.com/TheShahnawaaz/FirstToTen.git
cd FirstToTen
```

### 2. Set up environment variables

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

Edit each `.env` file with your values (see [Environment Variables](#-environment-variables) below).

### 3. Install all dependencies

```bash
npm run install-all
```

### 4. Start development servers

```bash
npm run dev
```

This starts both backend (port `5050`) and frontend (port `5173`) simultaneously with color-coded output.

Or start them individually:

```bash
npm run dev-backend    # backend only
npm run dev-frontend   # frontend only
```

---

## 🔧 Environment Variables

### `backend/.env`

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the backend server listens on | `5050` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) | `xxxx.apps.googleusercontent.com` |

### `frontend/.env`

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend WebSocket server URL | `http://localhost:5050` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) | `xxxx.apps.googleusercontent.com` |

---

## 🎮 How to Play

1. **Enter your name** on the login screen (no account needed)
2. **Join the queue** — you'll be matched with the next available player
3. **Solve math problems** as fast as possible — first to answer correctly wins the round
4. **Watch your opponent** — a live typing indicator shows when they're working on an answer
5. **Win 10 rounds** to claim victory
6. **Review your performance** on the post-match analysis screen

### Round Outcomes

| Outcome | What happened |
|---|---|
| **Round Won!** | You answered first, correctly |
| **Clutch Recovery!** | You made a wrong guess but recovered before your opponent |
| **Capitalized!** | Opponent guessed wrong; you seized the opportunity |
| **Round Lost** | Opponent answered first |
| **Punished!** | Your wrong guess let the opponent solve it |
| **Time's Up!** | Neither player answered in 10 seconds |

---

## 🧰 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| [Node.js](https://nodejs.org/) | JavaScript runtime |
| [Express](https://expressjs.com/) | HTTP server & REST API |
| [Socket.io](https://socket.io/) | Real-time bidirectional WebSocket communication |
| [dotenv](https://github.com/motdotla/dotenv) | Environment variable management |

### Frontend
| Technology | Purpose |
|---|---|
| [React 19](https://react.dev/) | UI component framework |
| [Vite 8](https://vitejs.dev/) | Build tool & dev server |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first styling |
| [Framer Motion](https://www.framer.com/motion/) | Animations & transitions |
| [Socket.io Client](https://socket.io/docs/v4/client-api/) | WebSocket client |
| [Lucide React](https://lucide.dev/) | Icon library |
| [Recharts](https://recharts.org/) | Post-game analytics charts |

---

## 📡 WebSocket Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `login` | `{ name, picture? }` | Authenticate with a display name |
| `join_queue` | — | Join the matchmaking queue |
| `leave_queue` | — | Exit the matchmaking queue |
| `submit_answer` | `{ answer }` | Submit an answer for the current round |
| `typing_status` | `{ isTyping }` | Broadcast typing state to opponent |
| `leave_game` | — | Forfeit the current match |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `login_success` | `{ id, name, picture }` | Login confirmed |
| `match_found` | `{ opponent, scores }` | A match has been found |
| `round_start` | `{ roundNum, questionText, timeLimit, scores }` | New round begins |
| `timer_tick` | `{ timeRemaining }` | Countdown tick (every second) |
| `answer_result` | `{ correct }` | Result of your submitted answer |
| `round_end` | `{ winnerId, correctAnswer, scores, elapsedMs }` | Round concluded |
| `opponent_typing` | `{ isTyping }` | Opponent typing state |
| `game_over` | `{ winnerId, ... analysis }` | Match concluded with full analysis |
| `opponent_left` | `{ winnerId, reason }` | Opponent disconnected |

---

## 🚢 Deployment

### Frontend → Vercel

🌐 **Live:** [https://first-to-ten.vercel.app](https://first-to-ten.vercel.app)

The frontend is deployed on [Vercel](https://vercel.com). Set the following environment variable in the Vercel dashboard:

```
VITE_API_URL=https://first-to-ten-backend.onrender.com
```

Build settings:
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### Backend → Render

🌐 **Live:** [https://first-to-ten-backend.onrender.com](https://first-to-ten-backend.onrender.com)

The backend is deployed on [Render](https://render.com) as a Web Service. Set the following environment variables in the Render dashboard:

```
PORT=5050
NODE_ENV=production
```

Render settings:
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Plan:** Free (or Starter for always-on)

---

## 📁 Scripts Reference

Run from the **monorepo root**:

| Script | Description |
|---|---|
| `npm run install-all` | Install dependencies for root, backend, and frontend |
| `npm run dev` | Start both backend and frontend concurrently |
| `npm run dev-backend` | Start backend only |
| `npm run dev-frontend` | Start frontend only |

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Built with ❤️ by [Shahnawaz](https://github.com/TheShahnawaaz)

</div>
