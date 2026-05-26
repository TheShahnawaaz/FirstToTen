import React, { useEffect, useState } from 'react';
import { Play, LogOut, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Matchmaker({ user, onLogout, socket, onMatchFound }) {
  const [inQueue, setInQueue] = useState(false);
  const [queueSeconds, setQueueSeconds] = useState(0);

  // Queue timer ticker
  useEffect(() => {
    let timer = null;
    if (inQueue) {
      setQueueSeconds(0);
      timer = setInterval(() => {
        setQueueSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setQueueSeconds(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [inQueue]);

  // Matchfound socket handler
  useEffect(() => {
    if (!socket) return;

    const handleMatchFound = (data) => {
      setInQueue(false);
      onMatchFound(data);
    };

    socket.on('match_found', handleMatchFound);

    return () => {
      socket.off('match_found', handleMatchFound);
    };
  }, [socket, onMatchFound]);

  const toggleQueue = () => {
    if (inQueue) {
      socket.emit('leave_queue');
      setInQueue(false);
    } else {
      socket.emit('join_queue');
      setInQueue(true);
    }
  };

  const formatQueueTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[70svh]">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm glass-card rounded-2xl p-8 flex flex-col items-center border border-slate-800/80 shadow-2xl relative"
      >
        {/* User Badge Info */}
        <div className="flex items-center gap-3 w-full border-b border-slate-850/80 pb-5 mb-6 select-none">
          <div className="w-10 h-10 rounded-full border border-slate-800 bg-slate-900/60 p-0.5">
            <img
              src={user.picture}
              alt=""
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Signed in as</span>
            <span className="block text-sm font-extrabold text-white truncate leading-none">{user.name}</span>
          </div>
          <button
            onClick={onLogout}
            disabled={inQueue}
            className="p-2 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-rose-400 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Leave Lobby"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lobby Content states */}
        <AnimatePresence mode="wait">
          {!inQueue ? (
            <motion.div
              key="find-match"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full flex flex-col items-center text-center"
            >
              <h3 className="text-lg font-bold text-white mb-2 leading-none">Find a Match</h3>
              <p className="text-xs text-slate-500 leading-normal max-w-[240px] mb-8">
                Click search to queue up. You will duel the next player who joins the lobby.
              </p>
              
              <button
                onClick={toggleQueue}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-extrabold text-sm tracking-wider shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-current" />
                FIND OPPONENT
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="in-queue"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full flex flex-col items-center text-center select-none"
            >
              {/* Radar Pulsing graphic */}
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping"></div>
                <div className="absolute inset-1.5 rounded-full border border-cyan-500/10 animate-pulse"></div>
                <div className="absolute inset-3 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                </div>
              </div>

              <h3 className="text-base font-bold text-cyan-400 neon-text-cyan mb-1 animate-pulse leading-none">
                Searching for Opponent
              </h3>
              <p className="text-[10px] text-slate-500 mb-6">Waiting for someone to join the arena...</p>
              
              <div className="text-xl font-bold text-slate-300 font-mono tracking-widest bg-slate-900/60 py-2 px-5 rounded-xl border border-slate-850 mb-8">
                {formatQueueTime(queueSeconds)}
              </div>

              <button
                onClick={toggleQueue}
                className="w-full py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all active:scale-[0.98]"
              >
                Cancel Search
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
