import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VirtualNumpad from './VirtualNumpad';
import audio from '../utils/audio';
import { Button } from './ui/Button';

// Sub-components for performance optimization (memoized to prevent re-renders on keystroke)

const GameHeader = React.memo(function GameHeader({ roundNum, muted, onForfeit, onToggleMute }) {
  return (
    <div className="flex justify-between items-center py-4 border-b border-white/10 select-none">
      <button
        onClick={onForfeit}
        className="text-xs font-semibold text-zinc-500 hover:text-white transition-colors"
      >
        Forfeit
      </button>

      <div className="flex flex-col items-center">
        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-none mb-1">Match</span>
        <span className="text-sm font-semibold text-white leading-none">Round {roundNum}</span>
      </div>

      <button
        onClick={onToggleMute}
        className="text-zinc-500 hover:text-white transition-colors"
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
});

const PlayerPanel = React.memo(function PlayerPanel({ player, score, isYou, opponentTyping = false }) {
  const renderScorePips = (playerScore, isActivePlayer) => {
    return (
      <div className="flex gap-[2px] mt-2 w-full">
        {Array.from({ length: 10 }).map((_, idx) => {
          const isScored = idx < playerScore;
          return (
            <div
              key={idx}
              className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                isScored 
                  ? isActivePlayer ? 'bg-white' : 'bg-zinc-400'
                  : 'bg-white/10'
              }`}
            />
          );
        })}
      </div>
    );
  };

  if (isYou) {
    return (
      <div className="flex-1 flex flex-col items-start min-w-0 bg-[#111111] border border-white/10 rounded-xl p-2.5">
        <div className="flex items-center gap-2 w-full">
          <div className="w-6 h-6 rounded-full border border-white/10 bg-[#1a1a1a] flex-shrink-0 overflow-hidden">
            <img src={player.picture} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[8px] font-semibold text-zinc-500 block uppercase tracking-wider leading-none mb-0.5">You</span>
            <span className="text-xs font-semibold text-white block truncate leading-none">{player.name}</span>
          </div>
          <span className="text-sm font-bold text-white flex-shrink-0">{score}</span>
        </div>
        {renderScorePips(score, true)}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-end min-w-0 bg-[#111111] border border-white/10 rounded-xl p-2.5 relative">
      <div className="flex items-center gap-2 w-full justify-end text-right">
        <span className="text-sm font-bold text-zinc-400 flex-shrink-0">{score}</span>
        <div className="min-w-0 flex-1">
          <span className="text-[8px] font-semibold text-zinc-500 block uppercase tracking-wider leading-none mb-0.5">Opponent</span>
          <span className="text-xs font-semibold text-zinc-300 block truncate leading-none">{player.name}</span>
        </div>
        <div className="w-6 h-6 rounded-full border border-white/10 bg-[#1a1a1a] flex-shrink-0 overflow-hidden opacity-80">
          <img src={player.picture} alt="" className="w-full h-full object-cover" />
        </div>
      </div>
      {renderScorePips(score, false)}
      
      {/* Real-time typing status tag */}
      <AnimatePresence>
        {opponentTyping && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute -top-7 right-0 flex items-center gap-1.5 py-1 px-2.5 rounded border border-indigo-500/20 bg-indigo-500/10 text-[9px] font-semibold text-indigo-400"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            Typing...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const TimerCircle = React.memo(function TimerCircle({ timeRemaining }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeRemaining / 10) * circumference;

  return (
    <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center bg-[#111111] border border-white/10 rounded-xl">
      <svg className="w-12 h-12 transform -rotate-90">
        <circle
          cx="24"
          cy="24"
          r={radius}
          className="stroke-white/5 stroke-[2] fill-none"
        />
        <motion.circle
          cx="24"
          cy="24"
          r={radius}
          className={`stroke-[2] fill-none ${
            timeRemaining <= 3 ? 'stroke-rose-500' : 'stroke-white'
          }`}
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'linear' }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-mono">
        <span className={`text-[13px] font-semibold ${
          timeRemaining <= 3 ? 'text-rose-500 text-sm animate-pulse' : 'text-zinc-300'
        }`}>
          {timeRemaining}
        </span>
      </div>
    </div>
  );
});


export default function GameDuel({ user, opponent, socket, initialScores, onLeave, onGameOver }) {
  const [scores, setScores] = useState(initialScores || {});
  const [roundNum, setRoundNum] = useState(1);
  const [questionText, setQuestionText] = useState('...');
  const [timeRemaining, setTimeRemaining] = useState(10);
  
  // Input states
  const [inputValue, setInputValue] = useState('');
  const inputValueRef = useRef('');

  const [disabled, setDisabled] = useState(false);
  const [shake, setShake] = useState(false);
  const [muted, setMuted] = useState(audio.isMuted());
  
  // Real-time statuses
  const [opponentTyping, setOpponentTyping] = useState(false);
  const [showErrorNotice, setShowErrorNotice] = useState(false);

  // Round resolution state
  const [roundStatus, _setRoundStatus] = useState('thinking'); // 'thinking' | 'ended'
  const [roundEndData, setRoundEndData] = useState(null);

  // Keep refs of fast-changing states for socket callback scopes to prevent listener re-registration
  const roundStatusRef = useRef('thinking');
  const disabledRef = useRef(false);
  const wasTypingRef = useRef(false);

  const setRoundStatus = (status) => {
    roundStatusRef.current = status;
    _setRoundStatus(status);
  };

  const updateDisabledState = (state) => {
    disabledRef.current = state;
    setDisabled(state);
  };

  const updateInputValue = (val) => {
    inputValueRef.current = val;
    setInputValue(val);
  };

  // Play match start chime on load
  useEffect(() => {
    audio.playMatchStart();
  }, []);

  // Listen to socket game events (bound exactly once on component mount)
  useEffect(() => {
    if (!socket) return;

    const handleRoundStart = (data) => {
      setScores(data.scores);
      setRoundNum(data.roundNum);
      setQuestionText(data.questionText);
      setTimeRemaining(data.timeLimit);
      updateInputValue('');
      wasTypingRef.current = false;
      updateDisabledState(false);
      setRoundStatus('thinking');
      setRoundEndData(null);
      setShowErrorNotice(false);
      setOpponentTyping(false);
    };

    const handleTimerTick = (data) => {
      setTimeRemaining(data.timeRemaining);
      if (data.timeRemaining <= 3 && data.timeRemaining > 0 && roundStatusRef.current === 'thinking') {
        audio.playTick();
      }
    };

    const handleRoundEnd = (data) => {
      setScores(data.scores);
      setRoundStatus('ended');
      setRoundEndData(data);
      updateDisabledState(true);
      setOpponentTyping(false);
      
      if (data.winnerId === user.id) {
        audio.playCorrect();
      } else {
        audio.playWrong();
      }
    };

    const handleAnswerResult = (data) => {
      if (!data.correct) {
        setShake(true);
        audio.playWrong();
        updateInputValue(''); // Clear incorrect input immediately
        wasTypingRef.current = false;
        setShowErrorNotice(true);
        
        // Broadcast that we stopped typing since input is cleared
        socket.emit('typing_status', { isTyping: false });

        setTimeout(() => setShake(false), 500);
        setTimeout(() => setShowErrorNotice(false), 1500);
      }
    };

    const handleGameOver = (analysis) => {
      updateDisabledState(true);
      if (analysis.winnerId === user.id) {
        audio.playVictory();
      } else {
        audio.playDefeat();
      }
      
      setTimeout(() => {
        onGameOver(analysis);
      }, 4000);
    };

    const handleOpponentLeft = (data) => {
      updateDisabledState(true);
      audio.playVictory();
      
      setRoundStatus('ended');
      setRoundEndData({
        winnerId: data.winnerId,
        reason: data.reason,
        correctAnswer: 'Opponent Disconnected'
      });
    };

    const handleOpponentTyping = (data) => {
      setOpponentTyping(data.isTyping);
    };

    socket.on('round_start', handleRoundStart);
    socket.on('timer_tick', handleTimerTick);
    socket.on('round_end', handleRoundEnd);
    socket.on('answer_result', handleAnswerResult);
    socket.on('game_over', handleGameOver);
    socket.on('opponent_left', handleOpponentLeft);
    socket.on('opponent_typing', handleOpponentTyping);

    return () => {
      socket.off('round_start', handleRoundStart);
      socket.off('timer_tick', handleTimerTick);
      socket.off('round_end', handleRoundEnd);
      socket.off('answer_result', handleAnswerResult);
      socket.off('game_over', handleGameOver);
      socket.off('opponent_left', handleOpponentLeft);
      socket.off('opponent_typing', handleOpponentTyping);
    };
  }, [socket, user.id, opponent.id, onGameOver]);

  const handleInputChange = useCallback((val) => {
    if (disabledRef.current) return;
    updateInputValue(val);
    
    // Broadcast typing status to opponent only when typing status changes
    const isTyping = val.length > 0;
    if (isTyping !== wasTypingRef.current) {
      wasTypingRef.current = isTyping;
      socket.emit('typing_status', { isTyping });
    }
  }, [socket]);

  const handleSubmit = useCallback(() => {
    const val = inputValueRef.current;
    if (disabledRef.current || !val.trim() || val === '-') return;
    socket.emit('submit_answer', { answer: val.trim() });
  }, [socket]);

  const handleToggleMute = useCallback(() => {
    const isNowMuted = audio.toggleMute();
    setMuted(isNowMuted);
  }, []);

  const handleForfeit = useCallback(() => {
    if (window.confirm('Are you sure you want to forfeit this duel? Your opponent will win.')) {
      socket.emit('leave_game');
      onLeave();
    }
  }, [socket, onLeave]);

  // Determine round end UI banner cases
  const getRoundEndMessage = () => {
    if (!roundEndData) return { title: 'Round Ended', desc: '', icon: null };

    const { winnerId, reason, elapsedMs } = roundEndData;
    
    if (reason === 'opponent_disconnected' || reason === 'opponent_left') {
      return {
        title: 'Opponent Left',
        desc: 'The opponent exited the match early. You win the session!',
        icon: <AlertCircle className="w-10 h-10 text-indigo-400 mb-3" />
      };
    }

    if (!winnerId) {
      return {
        title: "Time's Up!",
        desc: 'Neither player answered correctly.',
        icon: <AlertCircle className="w-10 h-10 text-zinc-500 mb-3" />
      };
    }

    if (winnerId === user.id) {
      return {
        title: 'Round Won!',
        desc: `You answered correctly in ${(elapsedMs / 1000).toFixed(2)}s.`,
        icon: <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
      };
    }

    if (winnerId === opponent.id) {
      return {
        title: 'Round Lost',
        desc: 'Opponent answered correctly first.',
        icon: <XCircle className="w-10 h-10 text-rose-500 mb-3" />
      };
    }

    return { title: 'Round Ended', desc: '', icon: null };
  };

  const endMsg = getRoundEndMessage();

  return (
    <div className="w-full max-w-md mx-auto flex flex-col min-h-[92svh] justify-between relative overflow-hidden">
      
      {/* HEADER BAR */}
      <GameHeader
        roundNum={roundNum}
        muted={muted}
        onForfeit={handleForfeit}
        onToggleMute={handleToggleMute}
      />

      {/* MATCH PLAYERS STATUS PANEL */}
      <div className="flex items-stretch justify-between gap-3 mt-6 select-none h-16">
        
        {/* Left Side: You */}
        <PlayerPanel
          player={user}
          score={scores[user.id] || 0}
          isYou={true}
        />

        {/* MIDDLE: Circular Timer */}
        <TimerCircle
          timeRemaining={timeRemaining}
        />

        {/* Right Side: Opponent */}
        <PlayerPanel
          player={opponent}
          score={scores[opponent.id] || 0}
          isYou={false}
          opponentTyping={opponentTyping}
        />
        
      </div>

      {/* GAMEPLAY CORE DESK */}
      <div className="flex flex-col items-center justify-center py-6 flex-grow">
        {/* MATH QUESTION DISPLAY SCREEN */}
        <motion.div
          animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className={`w-full bg-[#111111] rounded-2xl p-8 text-center flex flex-col items-center justify-center relative min-h-[180px] border transition-colors duration-200 ${
            shake 
              ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.1)]' 
              : roundStatus === 'ended' && roundEndData?.winnerId === user.id
              ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
              : 'border-white/10'
          }`}
        >
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2 leading-none">Solve This</span>
          <h2 className="text-5xl font-semibold text-white leading-tight font-mono tracking-tight m-0">
            {questionText}
          </h2>

          {/* Value Display */}
          <div className="mt-8 flex flex-col items-center justify-center h-10 w-full select-none">
            <AnimatePresence mode="wait">
              {showErrorNotice ? (
                <motion.span
                  key="incorrect-text"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-sm font-medium text-rose-500"
                >
                  Incorrect! Try again.
                </motion.span>
              ) : (
                <motion.div
                  key="input-container"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center text-2xl font-semibold font-mono text-white border-b-2 border-white/20 px-4 min-w-[60px] h-10 tracking-widest pb-1"
                >
                  <span>{inputValue}</span>
                  <motion.span 
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-0.5 h-6 bg-indigo-500 ml-1.5 inline-block"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* NUMPAD CONTROL PANEL */}
      <div className="mb-4">
        <VirtualNumpad
          value={inputValue}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          disabled={disabled}
        />
      </div>

      {/* OVERLAY TRANSITION BANNER */}
      <AnimatePresence>
        {roundStatus === 'ended' && roundEndData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6 select-none"
          >
            <motion.div
              initial={{ scale: 0.96, y: 10, filter: 'blur(4px)' }}
              animate={{ scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ scale: 0.96, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#111111] max-w-sm w-full rounded-2xl p-8 border border-white/10 text-center flex flex-col items-center shadow-2xl"
            >
              {endMsg.icon}
              <h3 className="text-xl font-semibold text-white tracking-tight leading-tight mb-2">
                {endMsg.title}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                {endMsg.desc}
              </p>

              {/* Reveal Correct Answer */}
              <div className="w-full bg-[#1a1a1a] border border-white/5 p-4 rounded-xl text-center mb-6">
                <span className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Correct Answer</span>
                <span className="text-2xl font-semibold font-mono text-white leading-none">{roundEndData.correctAnswer}</span>
              </div>

              {/* Loader Countdown Progress bar or exit lobby action */}
              {roundEndData.reason === 'opponent_disconnected' || roundEndData.reason === 'opponent_left' ? (
                <Button
                  onClick={onLeave}
                  variant="primary"
                  className="w-full"
                >
                  Return to Lobby
                </Button>
              ) : (
                <div className="w-full bg-[#1a1a1a] h-1 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 3, ease: 'linear' }}
                    className="h-full bg-white"
                  />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
