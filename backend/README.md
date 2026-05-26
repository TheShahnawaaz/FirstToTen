# ⚙️ First To Ten — Backend Service

**Real-time Node.js + Socket.io Server for the Math Duel Arena**

---

## 🛠️ Overview
This backend service manages real-time multiplayer lobbies, matchmaking queues, live gameplay synchronization, scoring systems, and final round metrics generation.

It runs a simplified in-memory matchmaking system that pairs players instantly and hosts their game sessions dynamically.

---

## ⚙️ Environment Variables
Create a `backend/.env` file with the following variables:

```env
PORT=5050
NODE_ENV=development
```

---

## 📡 WebSocket API Protocol (Socket.io)

### Client Listeners (Client to Server)
- **`login`**: Authenticate the socket connection.
  - Data: `{ name: string, picture: string }`
- **`join_queue`**: Enter the matchmaking pool.
- **`leave_queue`**: Withdraw from matchmaking.
- **`submit_answer`**: Submit an answer for the current round.
  - Data: `{ answer: string }`
- **`typing_status`**: Broadcast active typing state to opponent.
  - Data: `{ isTyping: boolean }`
- **`leave_game`**: Forfeit and leave the active game session.

### Client Emitters (Server to Client)
- **`login_success`**: Sent after successful name registration.
  - Data: `{ id: number, name: string, picture: string }`
- **`login_error`**: Sent if registration fails.
  - Data: `{ message: string }`
- **`match_found`**: Fired when two queueing players are successfully paired.
  - Data: `{ roomId: string, opponent: Profile, yourId: number, scores: object }`
- **`round_start`**: Fired when a round starts (1.2s delay after match found to allow screen rendering).
  - Data: `{ roundNum: number, questionText: string, timeLimit: number, scores: object }`
- **`timer_tick`**: Fired every second to synchronize round clocks.
  - Data: `{ timeRemaining: number }`
- **`answer_result`**: Fired individually to a player when they submit a wrong answer.
  - Data: `{ correct: boolean }`
- **`round_end`**: Fired when a player answers correctly or the clock runs down.
  - Data: `{ roundNum: number, winnerId: number|null, reason: 'correct'|'timeout', scores: object, correctAnswer: number, elapsedMs: number|null }`
- **`game_over`**: Fired when a player reaches 10 points. Includes full game metrics.
  - Data: `{ winnerId: number, finalScores: object, roundsPlayed: number, timeline: array, playerStats: object, history: array }`
- **`opponent_left`**: Fired if the opponent forfeits or disconnects.
  - Data: `{ winnerId: number, reason: 'opponent_left'|'opponent_disconnected' }`
- **`opponent_typing`**: Broadcasts when the opponent is typing in their numpad.
  - Data: `{ isTyping: boolean }`

---

## 🚀 Running Locally
### 1. Install dependencies
```bash
npm install
```

### 2. Start dev server (with hot reloading)
```bash
npm run dev
```
The server will bind and start listening on port `5050` by default.
