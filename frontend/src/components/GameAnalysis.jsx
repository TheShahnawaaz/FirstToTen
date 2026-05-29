import React from 'react';
import { Trophy, RefreshCw, Zap, Target } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

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
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4 select-none">
      
      {/* WINNER CARD STATUS BANNER */}
      <motion.div
        initial={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="p-8 text-center flex flex-col items-center surface-card relative overflow-hidden bg-[#111111]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 border ${
            isWinner 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-zinc-800/50 border-white/10 text-zinc-400'
          }`}>
            <Trophy className="w-5 h-5" />
          </div>

          <h2 className={`text-2xl font-bold tracking-tight mb-2 ${
            isWinner ? 'text-white' : 'text-zinc-300'
          }`}>
            {isWinner ? 'Victory' : 'Defeat'}
          </h2>
          
          <p className="text-sm text-zinc-500 max-w-[280px] leading-relaxed mb-6">
            {isWinner 
              ? `Excellent performance! You scored 10 points first.` 
              : `Good try! Your opponent answered faster in this duel.`}
          </p>

          {/* Final score indicator */}
          <div className="flex items-center gap-6 bg-[#1a1a1a] border border-white/10 py-3 px-8 rounded-full text-sm shadow-inner">
            <div className="text-center font-bold">
              <span className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-widest leading-none mb-1">You</span>
              <span className="text-xl text-white leading-none font-mono">{analysis.finalScores[p1Id]}</span>
            </div>
            <span className="text-zinc-700 font-medium text-xl">:</span>
            <div className="text-center font-bold">
              <span className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-widest leading-none mb-1">Opponent</span>
              <span className="text-xl text-zinc-400 leading-none font-mono">{analysis.finalScores[p2Id]}</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* LINE CHART GRAPH CARD */}
      <motion.div
        initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="p-6 bg-[#111111]">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-6 text-center leading-none">Scoring Progression</h3>
          
          <div className="w-full h-48 pr-4 text-[10px] font-mono text-zinc-500">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 5, left: -30, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
                <XAxis dataKey="round" stroke="#52525b" tickLine={false} axisLine={false} dy={10} />
                <YAxis domain={[0, 10]} stroke="#52525b" tickCount={6} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip
                  contentStyle={{ background: '#111111', borderColor: '#333333', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ fontWeight: '500' }}
                  cursor={{ stroke: '#333333', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }} iconType="circle" />
                <Line
                  type="monotone"
                  dataKey={user.name}
                  stroke="#ffffff"
                  strokeWidth={2}
                  activeDot={{ r: 4, fill: '#ffffff', stroke: '#000000', strokeWidth: 2 }}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey={opponent.name}
                  stroke="#71717a"
                  strokeWidth={2}
                  activeDot={{ r: 4, fill: '#71717a', stroke: '#000000', strokeWidth: 2 }}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* MATCH PERFORMANCE METRICS */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.3, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-5 flex flex-col justify-between bg-[#111111] h-full">
            <div className="flex items-center gap-2 text-zinc-400 mb-3">
              <Zap className="w-4 h-4" />
              <span className="text-[10px] font-semibold uppercase tracking-widest">Avg Speed</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-white block">{formatTime(myStats.avgSpeedMs)}</span>
              <span className="text-[10px] font-medium text-zinc-500 block mt-1">Opponent: {formatTime(oppStats.avgSpeedMs)}</span>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.3, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-5 flex flex-col justify-between bg-[#111111] h-full">
            <div className="flex items-center gap-2 text-zinc-400 mb-3">
              <Target className="w-4 h-4" />
              <span className="text-[10px] font-semibold uppercase tracking-widest">Accuracy</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-white block">{myStats.accuracy}%</span>
              <span className="text-[10px] font-medium text-zinc-500 block mt-1">Opponent: {oppStats.accuracy}%</span>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* FOOTER BUTTON ACTION */}
      <motion.div
        initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.3, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="mt-2"
      >
        <Button onClick={onRestart} variant="primary" className="w-full gap-2">
          <RefreshCw className="w-4 h-4 opacity-80" />
          Play Again
        </Button>
      </motion.div>
      
    </div>
  );
}
