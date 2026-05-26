import React from 'react';
import { Trophy, RefreshCw, Zap, Target } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';

export default function GameAnalysis({ user, opponent, analysis, onRestart }) {
  const isWinner = analysis.winnerId === user.id;
  const p1Id = user.id;
  const p2Id = opponent.id;

  const myStats = analysis.playerStats[p1Id] || {};
  const oppStats = analysis.playerStats[p2Id] || {};

  // Formats scoring timeline data for Recharts
  const chartData = analysis.timeline.map((point) => ({
    round: `R${point.round}`,
    [user.name]: point[p1Id],
    [opponent.name]: point[p2Id]
  }));

  const formatTime = (ms) => {
    if (!ms) return 'N/A';
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 flex flex-col gap-6 select-none">
      
      {/* WINNER CARD STATUS BANNER */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card rounded-2xl p-6 text-center flex flex-col items-center border border-slate-800/80 shadow-2xl relative overflow-hidden`}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-900/20 to-transparent pointer-events-none"></div>

        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 border ${
          isWinner 
            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
            : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
        }`}>
          <Trophy className="w-6 h-6" />
        </div>

        <h2 className={`text-2xl font-black uppercase tracking-wider leading-none mb-1.5 ${
          isWinner ? 'text-cyan-400 neon-text-cyan' : 'text-purple-400 neon-text-purple'
        }`}>
          {isWinner ? 'Victory!' : 'Defeat'}
        </h2>
        
        <p className="text-xs text-slate-500 max-w-[280px] leading-normal mb-5">
          {isWinner 
            ? `Excellent performance! You scored 10 points first.` 
            : `Good try! Your opponent answered faster in this duel.`}
        </p>

        {/* Final score indicator */}
        <div className="flex items-center gap-5 bg-slate-900/60 border border-slate-850 py-2 px-6 rounded-full text-sm">
          <div className="text-center font-bold">
            <span className="block text-[8px] font-bold text-slate-500 uppercase leading-none mb-0.5">You</span>
            <span className="text-white leading-none">{analysis.finalScores[p1Id]}</span>
          </div>
          <span className="text-slate-700 font-bold">:</span>
          <div className="text-center font-bold">
            <span className="block text-[8px] font-bold text-slate-500 uppercase leading-none mb-0.5">Opponent</span>
            <span className="text-white leading-none">{analysis.finalScores[p2Id]}</span>
          </div>
        </div>
      </motion.div>

      {/* LINE CHART GRAPH CARD */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-5 border border-slate-800/80 shadow-xl"
      >
        <h3 className="text-sm font-bold text-slate-350 mb-4 text-center leading-none">Scoring Progression</h3>
        
        <div className="w-full h-52 pr-2 text-[10px] font-mono text-slate-500">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -30, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="round" stroke="#6b7280" tickLine={false} />
              <YAxis domain={[0, 10]} stroke="#6b7280" tickCount={6} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0a0d1e', borderColor: '#1f2937', borderRadius: '10px' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey={user.name}
                stroke="#06b6d4"
                strokeWidth={2.5}
                activeDot={{ r: 5 }}
                dot={{ stroke: '#06b6d4', strokeWidth: 1, r: 2 }}
              />
              <Line
                type="monotone"
                dataKey={opponent.name}
                stroke="#d946ef"
                strokeWidth={2.5}
                activeDot={{ r: 5 }}
                dot={{ stroke: '#d946ef', strokeWidth: 1, r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* MATCH PERFORMANCE METRICS */}
      <div className="grid grid-cols-2 gap-4">
        
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-4 border border-slate-800/80 flex flex-col justify-between"
        >
          <div className="flex items-center gap-1.5 text-cyan-400 mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Speed</span>
          </div>
          <div>
            <span className="text-xl font-bold font-mono text-white block">{formatTime(myStats.avgSpeedMs)}</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Opponent: {formatTime(oppStats.avgSpeedMs)}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card rounded-2xl p-4 border border-slate-800/80 flex flex-col justify-between"
        >
          <div className="flex items-center gap-1.5 text-purple-400 mb-2">
            <Target className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Accuracy</span>
          </div>
          <div>
            <span className="text-xl font-bold font-mono text-white block">{myStats.accuracy}%</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Opponent: {oppStats.accuracy}%</span>
          </div>
        </motion.div>
        
      </div>

      {/* FOOTER BUTTON ACTION */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={onRestart}
        className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold text-sm tracking-wider transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        PLAY AGAIN
      </motion.button>
      
    </div>
  );
}
