import { useEffect, useState } from 'react';
import { LogOut, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export default function Matchmaker({ user, onLogout, socket, onMatchFound }) {
  const [inQueue, setInQueue] = useState(false);
  const [queueSeconds, setQueueSeconds] = useState(0);

  // Queue timer ticker
  useEffect(() => {
    if (!inQueue) return;

    const timer = setInterval(() => {
      setQueueSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [inQueue]);

  // Matchfound socket handler
  useEffect(() => {
    if (!socket) return;

    const handleMatchFound = (data) => {
      setInQueue(false);
      setQueueSeconds(0);
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
      setQueueSeconds(0);
    } else {
      socket.emit('join_queue');
      setInQueue(true);
      setQueueSeconds(0);
    }
  };

  const formatQueueTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60svh]">
      <Card className="w-full p-6 flex flex-col items-center surface-card relative overflow-hidden">
        
        {/* Subtle background gradient based on state */}
        <motion.div 
          className="absolute inset-0 z-0 opacity-20 pointer-events-none"
          animate={{
            background: inQueue 
              ? 'radial-gradient(circle at center, rgba(99,102,241,0.15) 0%, transparent 70%)' 
              : 'radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 70%)'
          }}
          transition={{ duration: 1 }}
        />

        {/* User Badge Info */}
        <div className="flex items-center justify-between w-full border-b border-white/5 pb-4 mb-6 z-10 select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-white/10 bg-[#111111] overflow-hidden flex-shrink-0">
              <img
                src={user.picture}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider leading-none mb-1">Alias</span>
              <span className="text-sm font-semibold text-white leading-none">{user.name}</span>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            disabled={inQueue}
            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Leave Lobby"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Lobby Content states */}
        <div className="w-full z-10 min-h-[220px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {!inQueue ? (
              <motion.div
                key="find-match"
                initial={{ opacity: 0, y: 10, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(2px)' }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-4">
                  <Search className="w-5 h-5 text-zinc-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 leading-none">Find an Opponent</h3>
                <p className="text-sm text-zinc-500 leading-relaxed max-w-[240px] mb-8">
                  Join the queue to be matched with the next available player.
                </p>
                
                <Button onClick={toggleQueue} variant="primary" className="w-full">
                  Search
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="in-queue"
                initial={{ opacity: 0, y: 10, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(2px)' }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full flex flex-col items-center text-center select-none"
              >
                {/* Minimalist loading ring */}
                <div className="relative w-16 h-16 mb-6 flex items-center justify-center">
                  <motion.svg 
                    className="absolute inset-0 w-full h-full text-indigo-500/30" 
                    viewBox="0 0 100 100"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  >
                    <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
                  </motion.svg>
                  <motion.svg 
                    className="absolute inset-0 w-full h-full text-indigo-500" 
                    viewBox="0 0 100 100"
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  >
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="30 220" strokeLinecap="round" />
                  </motion.svg>
                  <span className="text-xs font-medium text-indigo-400 font-mono">{formatQueueTime(queueSeconds)}</span>
                </div>

                <h3 className="text-base font-medium text-white mb-1 leading-none">
                  Searching...
                </h3>
                <p className="text-xs text-zinc-500 mb-8">Waiting for a worthy challenger</p>
                
                <Button onClick={toggleQueue} variant="secondary" className="w-full">
                  Cancel
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
