import React, { useState, useEffect } from 'react';
import { Shuffle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';

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
    <div className="flex flex-col items-center justify-center min-h-[60svh]">
      <Card className="w-full p-8 flex flex-col items-center surface-card">
        {/* AVATAR SELECTOR */}
        <div className="relative mb-8 select-none group">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-[#111111] border border-white/10 flex items-center justify-center p-2 shadow-inner">
            <img
              src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}`}
              alt="Avatar"
              className="w-full h-full object-contain filter grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={randomizeAvatar}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shadow-md"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        <h2 className="text-xl font-semibold tracking-tight text-white mb-2">
          Join the Arena
        </h2>
        <p className="text-sm text-zinc-500 text-center mb-8">
          Enter your alias to enter matchmaking.
        </p>

        <form onSubmit={handleJoin} className="w-full flex flex-col gap-4">
          <Input
            type="text"
            maxLength={12}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Alias..."
            disabled={isLoading}
            autoFocus
            className="text-center font-medium placeholder:font-normal"
          />

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !name.trim()}
            className="w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 opacity-80" />
              </>
            )}
          </Button>
        </form>

        {error && (
          <motion.p 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 text-xs font-medium text-rose-500 bg-rose-500/10 border border-rose-500/20 py-2.5 px-3 rounded-lg w-full text-center"
          >
            {error}
          </motion.p>
        )}
      </Card>
    </div>
  );
}
