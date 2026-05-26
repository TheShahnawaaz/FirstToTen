import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import NameEntry from './components/NameEntry';
import Matchmaker from './components/Matchmaker';
import GameDuel from './components/GameDuel';
import GameAnalysis from './components/GameAnalysis';
import { Sparkles, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="min-h-screen bg-[#07080e] relative text-slate-100 flex flex-col font-sans overflow-x-hidden antialiased">
      {/* BACKGROUND NEON LIGHT GLOWS */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-radial-cyan opacity-35 pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-radial-purple opacity-35 pointer-events-none z-0" />

      {/* SOCKET NETWORK STATUS FLOATER */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-1.5 py-1 px-2.5 rounded-full border bg-slate-950/80 border-slate-800 text-[10px] font-bold text-slate-400 select-none shadow-md shadow-black/25">
        {connected ? (
          <>
            <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>CONNECTED</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3 text-rose-500" />
            <span className="text-rose-400">RECONNECTING...</span>
          </>
        )}
      </div>

      {/* HEADER LOGO */}
      {screen !== 'GAME' && (
        <header className="w-full text-center py-8 z-10 select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2"
          >
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 shadow-md">
              <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white my-0 leading-none">
              FIRST TO <span className="neon-text-cyan">TEN</span>
            </h1>
          </motion.div>
        </header>
      )}

      {/* MAIN SCREEN ROUTER */}
      <main className="flex-grow w-full z-10 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="w-full"
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
        <footer className="w-full text-center py-6 text-[10px] font-bold text-slate-650 select-none z-10 border-t border-slate-900/50">
          FIRST TO TEN &copy; {new Date().getFullYear()} &bull; REAL-TIME MATHEMATICS ARENA
        </footer>
      )}
    </div>
  );
}
