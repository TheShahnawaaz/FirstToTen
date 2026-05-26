import crypto from 'crypto';

export class GameRoom {
  constructor(player1, player2) {
    this.roomId = crypto.randomUUID();
    // players = [ { id, socket, profile } ]
    this.players = [player1, player2];
    this.scores = {
      [player1.id]: 0,
      [player2.id]: 0
    };
    this.currentRound = 0;
    this.status = 'active'; // 'active' | 'finished'
    
    this.currentQuestion = null;
    this.roundStartTime = null;
    this.timerInterval = null;
    this.timeRemaining = 10;
    this.transitionTimeout = null;

    // Track detailed metrics for final analysis
    // Structure: { round: 1, question: "12 + 34", winnerId: "xyz" | null, details: { [playerId]: { wrongAnswers: 0, times: [] } } }
    this.gameHistory = [];
    // Track score timeline: [ { round: 0, [p1.id]: 0, [p2.id]: 0 } ]
    this.scoreTimeline = [
      {
        round: 0,
        [player1.id]: 0,
        [player2.id]: 0
      }
    ];

    // Initialize details for the current round
    this.roundDetails = {};
    this.resetRoundDetails();
  }

  resetRoundDetails() {
    this.roundDetails = {};
    for (const p of this.players) {
      this.roundDetails[p.id] = {
        wrongAnswers: 0,
        attempts: [], // array of { input, elapsedMs, correct }
        hasSubmittedCorrectly: false
      };
    }
  }

  generateQuestion() {
    const types = ['ADD', 'SUB', 'MUL', 'DIV'];
    const type = types[Math.floor(Math.random() * types.length)];
    let text = '';
    let answer = 0;

    switch (type) {
      case 'ADD': {
        const a = Math.floor(Math.random() * 90) + 10; // 10-99
        const b = Math.floor(Math.random() * 90) + 10; // 10-99
        text = `${a} + ${b}`;
        answer = a + b;
        break;
      }
      case 'SUB': {
        const a = Math.floor(Math.random() * 90) + 10; // 10-99
        const b = Math.floor(Math.random() * 90) + 10; // 10-99
        text = `${a} - ${b}`;
        answer = a - b;
        break;
      }
      case 'MUL': {
        const a = Math.floor(Math.random() * 11) + 2; // 2-12
        const b = Math.floor(Math.random() * 41) + 10; // 10-50
        text = `${a} × ${b}`;
        answer = a * b;
        break;
      }
      case 'DIV': {
        const divisor = Math.floor(Math.random() * 11) + 2; // 2-12
        const result = Math.floor(Math.random() * 41) + 10; // 10-50 (this is the target answer)
        const dividend = divisor * result;
        text = `${dividend} ÷ ${divisor}`;
        answer = result;
        break;
      }
    }

    this.currentQuestion = { text, answer, type };
    return this.currentQuestion;
  }

  broadcast(eventName, data) {
    for (const player of this.players) {
      player.socket.emit(eventName, data);
    }
  }

  startRound() {
    if (this.status !== 'active') return;

    this.currentRound++;
    this.generateQuestion();
    this.resetRoundDetails();
    this.timeRemaining = 10;
    this.roundStartTime = Date.now();

    // Broadcast round start to both players
    this.broadcast('round_start', {
      roundNum: this.currentRound,
      questionText: this.currentQuestion.text,
      timeLimit: 10,
      scores: this.scores
    });

    // Start 10-second countdown (sending ticks every 100ms or 1s for smoother sync)
    // Send ticks every 1 second to minimize websocket overhead, client can count down smoothly locally
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this.broadcast('timer_tick', { timeRemaining: this.timeRemaining });

      if (this.timeRemaining <= 0) {
        this.resolveRound(null, 'timeout');
      }
    }, 1000);
  }

  submitAnswer(playerId, answerStr) {
    if (this.status !== 'active' || !this.currentQuestion || this.timeRemaining <= 0) {
      return;
    }

    const elapsedMs = Date.now() - this.roundStartTime;
    const answerVal = parseInt(answerStr, 10);
    const isCorrect = answerVal === this.currentQuestion.answer;

    const pDetails = this.roundDetails[playerId];
    if (pDetails.hasSubmittedCorrectly) return; // Ignore if they already got it right

    pDetails.attempts.push({
      input: answerStr,
      elapsedMs,
      correct: isCorrect
    });

    if (isCorrect) {
      pDetails.hasSubmittedCorrectly = true;
      this.resolveRound(playerId, 'correct', elapsedMs);
    } else {
      pDetails.wrongAnswers++;
      // Notify ONLY the player who submitted the wrong answer
      const p = this.players.find(pl => pl.id === playerId);
      if (p) {
        p.socket.emit('answer_result', { correct: false });
      }
    }
  }

  resolveRound(winnerId, reason, elapsedMs = null) {
    if (this.timerInterval) clearInterval(this.timerInterval);

    // Update scores
    if (winnerId) {
      this.scores[winnerId]++;
    }

    // Record timeline point
    const p1 = this.players[0];
    const p2 = this.players[1];
    this.scoreTimeline.push({
      round: this.currentRound,
      [p1.id]: this.scores[p1.id],
      [p2.id]: this.scores[p2.id]
    });

    // Record round in game history
    this.gameHistory.push({
      round: this.currentRound,
      question: this.currentQuestion.text,
      questionType: this.currentQuestion.type,
      correctAnswer: this.currentQuestion.answer,
      winnerId,
      reason,
      details: JSON.parse(JSON.stringify(this.roundDetails)) // deep copy
    });

    // Broadcast round end
    const roundResult = {
      roundNum: this.currentRound,
      winnerId,
      reason, // 'correct' | 'timeout'
      scores: this.scores,
      correctAnswer: this.currentQuestion.answer,
      elapsedMs,
      roundDetails: this.roundDetails
    };
    this.broadcast('round_end', roundResult);

    // Check if game is over (first to 10 wins)
    const isGameOver = Object.values(this.scores).some(score => score >= 10);
    if (isGameOver) {
      this.status = 'finished';
      this.finishGame();
    } else {
      // Transition to next round after 3 seconds
      if (this.transitionTimeout) clearTimeout(this.transitionTimeout);
      this.transitionTimeout = setTimeout(() => {
        this.startRound();
      }, 3000);
    }
  }

  finishGame() {
    // Find winner
    const p1 = this.players[0];
    const p2 = this.players[1];
    const score1 = this.scores[p1.id];
    const score2 = this.scores[p2.id];
    const winnerId = score1 > score2 ? p1.id : p2.id;

    // Calculate detailed metrics for the final analysis
    const analysis = {
      winnerId,
      finalScores: this.scores,
      roundsPlayed: this.currentRound,
      timeline: this.scoreTimeline,
      playerStats: {
        [p1.id]: this.calculatePlayerStats(p1.id),
        [p2.id]: this.calculatePlayerStats(p2.id)
      },
      history: this.gameHistory.map(h => ({
        round: h.round,
        question: h.question,
        questionType: h.questionType,
        correctAnswer: h.correctAnswer,
        winnerId: h.winnerId,
        reason: h.reason,
        p1Data: {
          wrongAnswers: h.details[p1.id].wrongAnswers,
          correctTime: h.details[p1.id].attempts.find(a => a.correct)?.elapsedMs || null
        },
        p2Data: {
          wrongAnswers: h.details[p2.id].wrongAnswers,
          correctTime: h.details[p2.id].attempts.find(a => a.correct)?.elapsedMs || null
        }
      }))
    };

    this.broadcast('game_over', analysis);
  }

  calculatePlayerStats(playerId) {
    let totalAttempts = 0;
    let wrongAttempts = 0;
    let correctTimes = [];
    let correctPerType = { ADD: 0, SUB: 0, MUL: 0, DIV: 0 };
    let totalPerType = { ADD: 0, SUB: 0, MUL: 0, DIV: 0 };

    for (const round of this.gameHistory) {
      const qType = round.questionType;
      totalPerType[qType] = (totalPerType[qType] || 0) + 1;

      const pRoundDetail = round.details[playerId];
      wrongAttempts += pRoundDetail.wrongAnswers;
      totalAttempts += pRoundDetail.attempts.length;

      const correctAttempt = pRoundDetail.attempts.find(a => a.correct);
      if (correctAttempt) {
        correctTimes.push(correctAttempt.elapsedMs);
        correctPerType[qType]++;
      }
    }

    const avgSpeedMs = correctTimes.length > 0
      ? Math.round(correctTimes.reduce((a, b) => a + b, 0) / correctTimes.length)
      : null;

    const accuracy = totalAttempts > 0
      ? Math.round(((totalAttempts - wrongAttempts) / totalAttempts) * 100)
      : 100;

    return {
      avgSpeedMs,
      accuracy,
      wrongAttempts,
      correctPerType,
      totalPerType
    };
  }

  cleanup() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.transitionTimeout) clearTimeout(this.transitionTimeout);
  }
}
