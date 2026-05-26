import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, LogOut, CheckCircle2, XCircle, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VirtualNumpad from './VirtualNumpad';
import audio from '../utils/audio';

export default function GameDuel({ user, opponent, socket, initialScores, onLeave, onGameOver }) {
  const [scores, setScores] = useState(initialScores || {});
  const [roundNum, setRoundNum] = useState(1);
  const [questionText, setQuestionText] = useState('...');
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [inputValue, setInputValue] = useState('');
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

  const setRoundStatus = (status) => {
    roundStatusRef.current = status;
    _setRoundStatus(status);
  };

  const updateDisabledState = (state) => {
    disabledRef.current = state;
    setDisabled(state);
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
      setInputValue('');
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
        setInputValue(''); // Clear incorrect input immediately
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

  const handleInputChange = (val) => {
    if (disabled) return;
    setInputValue(val);
    // Broadcast typing status to opponent
    socket.emit('typing_status', { isTyping: val.length > 0 });
  };

  const handleSubmit = () => {
    if (disabled || !inputValue.trim() || inputValue === '-') return;
    socket.emit('submit_answer', { answer: inputValue.trim() });
  };

  const handleToggleMute = () => {
    const isNowMuted = audio.toggleMute();
    setMuted(isNowMuted);
  };

  const handleForfeit = () => {
    if (window.confirm('Are you sure you want to forfeit this duel? Your opponent will win.')) {
      socket.emit('leave_game');
      onLeave();
    }
  };

  // Determine round end UI banner cases
  const getRoundEndMessage = () => {
    if (!roundEndData) return { title: 'Round Ended', desc: '', icon: null };

    const { winnerId, reason, correctAnswer, elapsedMs, roundDetails } = roundEndData;
    
    if (reason === 'opponent_disconnected' || reason === 'opponent_left') {
      return {
        title: 'Opponent Left',
        desc: 'The opponent exited the match early. You win the session!',
        icon: <AlertCircle className="w-12 h-12 text-cyan-400 mb-3 animate-pulse" />
      };
    }

    if (!winnerId) {
      if (roundDetails) {
        const p1Wrong = roundDetails[user.id]?.wrongAnswers || 0;
        const p2Wrong = roundDetails[opponent.id]?.wrongAnswers || 0;
        
        if (p1Wrong > 0 && p2Wrong > 0) {
          return {
            title: 'Double Mistake!',
            desc: 'Both of you submitted wrong answers, and time ran out.',
            icon: <XCircle className="w-12 h-12 text-amber-500 mb-3" />
          };
        } else if (p1Wrong > 0) {
          return {
            title: 'Round Tied',
            desc: "Time's up! You guessed wrong, and neither player solved it.",
            icon: <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
          };
        } else if (p2Wrong > 0) {
          return {
            title: 'Round Tied',
            desc: "Time's up! Opponent guessed wrong, and neither player solved it.",
            icon: <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
          };
        }
      }
      return {
        title: "Time's Up!",
        desc: 'Neither player answered correctly in 10 seconds.',
        icon: <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
      };
    }

    if (winnerId === user.id) {
      if (roundDetails) {
        const myWrong = roundDetails[user.id]?.wrongAnswers || 0;
        const oppWrong = roundDetails[opponent.id]?.wrongAnswers || 0;
        
        if (oppWrong > 0 && myWrong === 0) {
          return {
            title: 'Capitalized!',
            desc: `Opponent guessed wrong, and you sealed the point in ${(elapsedMs / 1000).toFixed(2)}s!`,
            icon: <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3 animate-bounce" />
          };
        } else if (myWrong > 0) {
          return {
            title: 'Clutch Recovery!',
            desc: `You made a mistake but corrected it first in ${(elapsedMs / 1000).toFixed(2)}s!`,
            icon: <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3 animate-bounce" />
          };
        }
      }
      return {
        title: 'Round Won!',
        desc: `You answered correctly first in ${(elapsedMs / 1000).toFixed(2)}s!`,
        icon: <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3 animate-bounce" />
      };
    }

    if (winnerId === opponent.id) {
      if (roundDetails) {
        const myWrong = roundDetails[user.id]?.wrongAnswers || 0;
        const oppWrong = roundDetails[opponent.id]?.wrongAnswers || 0;
        
        if (myWrong > 0 && oppWrong === 0) {
          return {
            title: 'Punished!',
            desc: 'You guessed wrong, giving your opponent time to solve it.',
            icon: <XCircle className="w-12 h-12 text-rose-500 mb-3" />
          };
        } else if (oppWrong > 0) {
          return {
            title: 'Opponent Recovered',
            desc: 'Opponent recovered from an incorrect guess to beat you to the answer.',
            icon: <XCircle className="w-12 h-12 text-rose-500 mb-3" />
          };
        }
      }
      return {
        title: 'Round Lost',
        desc: 'Opponent answered correctly first.',
        icon: <XCircle className="w-12 h-12 text-rose-500 mb-3" />
      };
    }

    return { title: 'Round Ended', desc: '', icon: null };
  };

  const endMsg = getRoundEndMessage();

  // SVG Circular progress configurations
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeRemaining / 10) * circumference;

  const renderScorePips = (playerScore, colorClass) => {
    return (
      <div className="flex gap-1 mt-2">
        {Array.from({ length: 10 }).map((_, idx) => {
          const isActive = idx < playerScore;
          return (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isActive 
                  ? colorClass 
                  : 'bg-slate-800 border border-slate-700/60'
              }`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-5 flex flex-col min-h-[92svh] justify-between relative overflow-hidden">
      
      {/* HEADER BAR */}
      <div className="flex justify-between items-center border-b border-slate-850/80 pb-3 select-none">
        <button
          onClick={handleForfeit}
          className="flex items-center gap-1 py-1 px-2.5 rounded-lg border border-slate-850 bg-slate-900/40 text-[10px] font-bold text-slate-400 hover:text-rose-400 transition-colors"
        >
          Forfeit
        </button>

        <div className="text-center">
          <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-0.5">DUEL ARENA</span>
          <span className="text-xs font-black text-cyan-400 neon-text-cyan leading-none">ROUND {roundNum}</span>
        </div>

        <button
          onClick={handleToggleMute}
          className="p-1.5 rounded-lg border border-slate-850 bg-slate-900/40 text-slate-400 hover:text-white transition-colors"
        >
          {muted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
        </button>
      </div>

      {/* MATCH PLAYERS STATUS PANEL */}
      <div className="flex items-center justify-between gap-2 mt-4 select-none">
        
        {/* Left Side: You */}
        <div className="glass-card rounded-xl p-2.5 flex-1 flex flex-col items-start border-l-2 border-l-cyan-500 relative min-w-0">
          <div className="flex items-center gap-1.5 w-full">
            <img
              src={user.picture}
              alt=""
              className="w-7 h-7 rounded-full border border-cyan-500/20 bg-slate-900 flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[7px] font-bold text-slate-500 block uppercase tracking-wider leading-none mb-0.5">YOU</span>
              <span className="text-[10px] font-extrabold text-white block truncate leading-none">{user.name}</span>
            </div>
            <span className="text-base font-black text-cyan-400 neon-text-cyan leading-none flex-shrink-0">{scores[user.id] || 0}</span>
          </div>
          {renderScorePips(scores[user.id] || 0, 'bg-cyan-400 shadow-sm shadow-cyan-400/45')}
        </div>

        {/* MIDDLE: Circular Timer */}
        <div className="relative w-12 h-12 select-none flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r={radius}
              className="stroke-slate-850 stroke-[2] fill-none"
            />
            <motion.circle
              cx="24"
              cy="24"
              r={radius}
              className={`stroke-[2] fill-none ${
                timeRemaining <= 3 ? 'stroke-rose-500' : 'stroke-cyan-400'
              }`}
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-mono">
            <span className={`text-[11px] font-black tracking-tighter ${
              timeRemaining <= 3 ? 'text-rose-500 animate-pulse text-xs' : 'text-slate-300'
            }`}>
              {timeRemaining}s
            </span>
          </div>
        </div>

        {/* Right Side: Opponent */}
        <div className="glass-card rounded-xl p-2.5 flex-1 flex flex-col items-end border-r-2 border-r-purple-500 relative min-w-0">
          <div className="flex items-center gap-1.5 w-full justify-end text-right">
            <span className="text-base font-black text-purple-400 neon-text-purple leading-none flex-shrink-0">{scores[opponent.id] || 0}</span>
            <div className="min-w-0 flex-1">
              <span className="text-[7px] font-bold text-slate-500 block uppercase tracking-wider leading-none mb-0.5">OPPONENT</span>
              <span className="text-[10px] font-extrabold text-white block truncate leading-none">{opponent.name}</span>
            </div>
            <img
              src={opponent.picture}
              alt=""
              className="w-7 h-7 rounded-full border border-purple-500/20 bg-slate-900 flex-shrink-0"
            />
          </div>
          {renderScorePips(scores[opponent.id] || 0, 'bg-purple-400 shadow-sm shadow-purple-400/45')}
          
          {/* Real-time typing status tag */}
          <AnimatePresence>
            {opponentTyping && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -bottom-5 right-2 flex items-center gap-1 py-0.5 px-2 rounded-full border border-purple-800/40 bg-purple-950/20 text-[8px] font-bold text-purple-400"
              >
                <span className="w-1 h-1 rounded-full bg-purple-400 animate-ping"></span>
                Typing...
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
      </div>

      {/* GAMEPLAY CORE DESK */}
      <div className="flex flex-col items-center justify-center py-2 flex-grow">

        {/* MATH QUESTION DISPLAY SCREEN */}
        <motion.div
          animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className={`w-full max-w-sm glass-card rounded-2xl p-6 text-center flex flex-col items-center justify-center relative overflow-hidden min-h-[140px] border transition-colors duration-200 ${
            shake 
              ? 'border-rose-500/50 shadow-rose-950/25' 
              : roundStatus === 'ended' && roundEndData?.winnerId === user.id
              ? 'border-emerald-500/40 shadow-emerald-950/10'
              : 'border-slate-800/80'
          }`}
        >
          {/* Question Text */}
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 leading-none">SOLVE THIS</span>
          <h2 className="text-3xl font-black text-white leading-tight font-mono tracking-wide m-0">
            {questionText}
          </h2>

          {/* Value Display */}
          <div className="mt-4 flex flex-col items-center justify-center h-8 w-full select-none">
            <AnimatePresence mode="wait">
              {showErrorNotice ? (
                <motion.span
                  key="incorrect-text"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs font-semibold text-rose-500"
                >
                  Incorrect! Try again.
                </motion.span>
              ) : (
                <motion.div
                  key="input-container"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center text-xl font-bold font-mono text-cyan-400 border-b border-cyan-500/30 px-3 min-w-[40px] h-8 tracking-widest"
                >
                  <span>{inputValue}</span>
                  <motion.span 
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    className="w-[2px] h-5 bg-cyan-400 ml-1 inline-block"
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
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 select-none"
          >
            <motion.div
              initial={{ scale: 0.94, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: -10 }}
              className="glass-card max-w-sm w-full rounded-2xl p-6 border border-slate-800 text-center flex flex-col items-center"
            >
              {endMsg.icon}
              <h3 className="text-xl font-black text-white uppercase tracking-wider leading-tight mb-1">
                {endMsg.title}
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal mb-5 max-w-[220px]">
                {endMsg.desc}
              </p>

              {/* Reveal Correct Answer */}
              <div className="w-full bg-slate-900/80 border border-slate-850 p-3 rounded-xl text-center">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Correct Answer</span>
                <span className="text-lg font-bold font-mono text-white leading-none">{roundEndData.correctAnswer}</span>
              </div>

              {/* Loader Countdown Progress bar or exit lobby action */}
              {roundEndData.reason === 'opponent_disconnected' || roundEndData.reason === 'opponent_left' ? (
                <button
                  onClick={onLeave}
                  className="w-full mt-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs tracking-wider transition-colors active:scale-[0.98]"
                >
                  Return to Lobby
                </button>
              ) : (
                <div className="mt-5 w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 3, ease: 'linear' }}
                    className="h-full bg-cyan-400"
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
