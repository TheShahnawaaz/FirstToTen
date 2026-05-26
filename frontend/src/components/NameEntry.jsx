import React, { useState, useEffect } from 'react';
import { Sparkles, Shuffle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NameEntry({ onLogin, socket }) {
  const [name, setName] = useState('');
  const [seed, setSeed] = useState(Math.random().toString(36).substring(7));
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a nickname to start.');
      return;
    }
    
    setIsLoading(true);
    setError('');

    const profile = {
      name: name.trim(),
      picture: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}`
    };

    socket.emit('login', profile);
  };

  const randomizeAvatar = () => {
    setSeed(Math.random().toString(36).substring(7));
  };

  // Socket listener for login results
  useEffect(() => {
    if (!socket) return;

    const handleLoginSuccess = (user) => {
      setIsLoading(false);
      onLogin(user);
    };

    const handleLoginError = (err) => {
      setIsLoading(false);
      setError(err.message || 'Failed to join lobby. Try again.');
    };

    socket.on('login_success', handleLoginSuccess);
    socket.on('login_error', handleLoginError);

    return () => {
      socket.off('login_success', handleLoginSuccess);
      socket.off('login_error', handleLoginError);
    };
  }, [socket, onLogin]);

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[70svh]">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm p-8 glass-card rounded-2xl flex flex-col items-center border border-slate-800/80 shadow-2xl"
      >
        {/* AVATAR SELECTOR */}
        <div className="relative mb-6 select-none group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-900/90 border border-slate-800 flex items-center justify-center p-2">
            <img
              src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}`}
              alt="Avatar"
              className="w-full h-full object-contain"
            />
          </div>
          <button
            type="button"
            onClick={randomizeAvatar}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-colors shadow-lg"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white mb-1">
          First to Ten
        </h2>
        <p className="text-xs text-slate-500 text-center mb-6 max-w-[240px]">
          Enter your name to join the matchmaking lobby.
        </p>

        <form onSubmit={handleJoin} className="w-full">
          <div className="mb-4">
            <input
              type="text"
              maxLength={12}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full py-2.5 px-4 rounded-xl border border-slate-850 bg-slate-900/40 text-center text-white placeholder-slate-650 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/20 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
            ) : (
              <>
                Let's Duel
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-lg w-full text-center">
            {error}
          </p>
        )}
      </motion.div>
    </div>
  );
}
