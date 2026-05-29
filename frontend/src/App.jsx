import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import NameEntry from './components/NameEntry';
import Matchmaker from './components/Matchmaker';
import GameDuel from './components/GameDuel';
import GameAnalysis from './components/GameAnalysis';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils/cn';

// Establish connection to backend socket server
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';
const socket = io(API_URL, {
  autoConnect: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000
});

export default function App() {
  const [screen, setScreen] = useState('AUTH'); // 'AUTH' | 'LOBBY' | 'GAME' | 'ANALYSIS'
  const [user, setUser] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [initialScores, setInitialScores] = useState({});
  const [analysis, setAnalysis] = useState(null);
  const [connected, setConnected] = useState(socket.connected);

  // Monitor websocket connection state
  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setScreen('LOBBY');
  };

  const handleLogout = () => {
    socket.emit('leave_queue');
    setUser(null);
    setScreen('AUTH');
  };

  const handleMatchFound = (data) => {
    setOpponent(data.opponent);
    setInitialScores(data.scores);
    setScreen('GAME');
  };

  const handleLeaveGame = () => {
    setOpponent(null);
    setScreen('LOBBY');
  };

  const handleGameOver = (gameAnalysis) => {
    setAnalysis(gameAnalysis);
    setScreen('ANALYSIS');
  };

  const handleRestart = () => {
    setOpponent(null);
    setAnalysis(null);
    setScreen('LOBBY');
  };

  return (
    <div className="min-h-screen bg-black relative text-zinc-100 flex flex-col font-sans overflow-x-hidden antialiased selection:bg-indigo-500/30">
      
      {/* NOISE OVERLAY FOR TEXTURE */}
      <div className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      {/* SOCKET NETWORK STATUS FLOATER */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2 select-none">
        <div className={cn(
          "h-2 w-2 rounded-full",
          connected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]"
        )} />
        {!connected && <span className="text-[10px] font-medium text-rose-500/80 tracking-widest uppercase">Reconnecting</span>}
      </div>

      {/* HEADER LOGO */}
      {screen !== 'GAME' && (
        <header className="w-full text-center pt-16 pb-8 z-10 select-none">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex flex-col items-center gap-1"
          >
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="First To Ten Logo" className="w-6 h-6 object-contain shadow-md rounded-[5px] border border-white/5" />
              <h1 className="text-xl font-bold tracking-tight text-white m-0 leading-none">
                First To Ten
              </h1>
            </div>
            <p className="text-xs text-zinc-500 font-medium tracking-widest uppercase mt-2">Real-Time Math Arena</p>
          </motion.div>
        </header>
      )}

      {/* MAIN SCREEN ROUTER */}
      <main className="flex-grow w-full z-10 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md mx-auto"
          >
            {screen === 'AUTH' && (
              <NameEntry onLogin={handleLoginSuccess} socket={socket} />
            )}
            {screen === 'LOBBY' && (
              <Matchmaker
                user={user}
                onLogout={handleLogout}
                socket={socket}
                onMatchFound={handleMatchFound}
              />
            )}
            {screen === 'GAME' && (
              <GameDuel
                user={user}
                opponent={opponent}
                socket={socket}
                initialScores={initialScores}
                onLeave={handleLeaveGame}
                onGameOver={handleGameOver}
              />
            )}
            {screen === 'ANALYSIS' && (
              <GameAnalysis
                user={user}
                opponent={opponent}
                analysis={analysis}
                onRestart={handleRestart}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      {screen !== 'GAME' && (
        <footer className="w-full text-center py-8 text-[11px] font-medium text-zinc-600 select-none z-10">
          First To Ten &copy; {new Date().getFullYear()}
        </footer>
      )}
    </div>
  );
}
