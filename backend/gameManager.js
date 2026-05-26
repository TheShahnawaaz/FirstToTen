import { GameRoom } from './room.js';

class GameManager {
  constructor() {
    this.activeRooms = new Map(); // roomId -> GameRoom
    this.matchmakingQueue = []; // Array of players: { id, socket, profile }
  }

  addToQueue(player) {
    if (this.matchmakingQueue.some(p => p.id === player.id)) {
      console.log(`Player ${player.profile.name} (${player.id}) is already in the queue.`);
      return;
    }

    console.log(`Adding player ${player.profile.name} to matchmaking queue.`);
    this.matchmakingQueue.push(player);

    // If we have at least 2 players, pair them!
    this.checkAndMatch();
  }

  removeFromQueue(socketId) {
    const initialLen = this.matchmakingQueue.length;
    this.matchmakingQueue = this.matchmakingQueue.filter(p => p.socket.id !== socketId);
    if (this.matchmakingQueue.length < initialLen) {
      console.log(`Removed socket ${socketId} from matchmaking queue.`);
    }
  }

  checkAndMatch() {
    if (this.matchmakingQueue.length >= 2) {
      const player1 = this.matchmakingQueue.shift();
      const player2 = this.matchmakingQueue.shift();

      console.log(`Match found! Pairing ${player1.profile.name} vs ${player2.profile.name}`);

      const room = new GameRoom(player1, player2);
      this.activeRooms.set(room.roomId, room);

      player1.socket.join(room.roomId);
      player2.socket.join(room.roomId);

      player1.socket.emit('match_found', {
        roomId: room.roomId,
        opponent: player2.profile,
        yourId: player1.id,
        scores: room.scores
      });

      player2.socket.emit('match_found', {
        roomId: room.roomId,
        opponent: player1.profile,
        yourId: player2.id,
        scores: room.scores
      });

      this.setupRoomSocketListeners(room);

      // Start the first round after a short delay (1.2s) to allow clients 
      // to transition to the GAME screen and register their socket event listeners.
      room.startTimeout = setTimeout(() => {
        room.startRound();
      }, 1200);
    }
  }

  setupRoomSocketListeners(room) {
    for (const player of room.players) {
      player.socket.on('submit_answer', (data) => {
        if (room.status === 'active') {
          room.submitAnswer(player.id, data.answer);
        }
      });

      player.socket.on('leave_game', () => {
        this.handlePlayerExit(player.socket.id, 'left');
      });
    }
  }

  getRoom(roomId) {
    return this.activeRooms.get(roomId);
  }

  findRoomByPlayerSocketId(socketId) {
    for (const room of this.activeRooms.values()) {
      if (room.players.some(p => p.socket.id === socketId)) {
        return room;
      }
    }
    return null;
  }

  handlePlayerExit(socketId, reason) {
    const room = this.findRoomByPlayerSocketId(socketId);
    if (!room) return;

    room.cleanup();
    this.activeRooms.delete(room.roomId);

    const exitingPlayer = room.players.find(p => p.socket.id === socketId);
    const opponent = room.players.find(p => p.socket.id !== socketId);

    console.log(`Player ${exitingPlayer?.profile.name} left the game. Opponent: ${opponent?.profile.name}`);

    if (opponent) {
      opponent.socket.emit('opponent_left', {
        winnerId: opponent.id,
        reason: reason === 'disconnected' ? 'opponent_disconnected' : 'opponent_left'
      });
      opponent.socket.leave(room.roomId);
    }

    exitingPlayer?.socket.leave(room.roomId);

    if (room.currentRound > 1) {
      if (opponent) {
        room.scores[opponent.id] = 10;
      }
      room.status = 'finished';
      this.saveGameResults(room);
    }
  }

  handleDisconnect(socketId) {
    this.removeFromQueue(socketId);
    this.handlePlayerExit(socketId, 'disconnected');
  }

  saveGameResults(room) {
    // In-memory mode: log match results to console
    const p1 = room.players[0];
    const p2 = room.players[1];
    console.log(`💾 Match ${room.roomId} ended. Final Scores: ${p1.profile.name} (${room.scores[p1.id]}) vs ${p2.profile.name} (${room.scores[p2.id]})`);
  }
}

export const gameManager = new GameManager();
export default gameManager;
