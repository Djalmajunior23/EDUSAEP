import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Zap, TrendingUp, History } from 'lucide-react';
import { gamificationService, RankingEntry } from '../../services/gamificationService';
import { motion } from 'framer-motion';

interface RankingWidgetProps {
    limit?: number;
    title?: string;
    showCurrentUserId?: string;
}

export function RankingWidget({ limit = 5, title = "Ranking de Engajamento", showCurrentUserId }: RankingWidgetProps) {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await gamificationService.getRanking(limit);
      setRanking(data || []);
      setLoading(false);
    };
    load();
  }, [limit]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 animate-pulse space-y-4">
        <div className="h-6 bg-gray-100 dark:bg-gray-700 w-1/2 rounded"></div>
        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 dark:bg-gray-700 rounded-2xl"></div>)}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
      <h3 className="font-black text-gray-900 dark:text-white text-lg mb-6 flex items-center gap-2">
        <TrendingUp size={20} className="text-emerald-500" />
        {title}
      </h3>
      
      {ranking.length > 0 ? (
        <div className="space-y-3">
          {ranking.map((player, idx) => (
            <motion.div 
                key={player.userId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex items-center justify-between p-3 rounded-2xl transition-all ${player.userId === showCurrentUserId ? 'bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/30' : idx < 3 ? 'bg-amber-50/30 dark:bg-amber-500/5' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black ${
                  idx === 0 ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 
                  idx === 1 ? 'bg-gray-400 text-white' : 
                  idx === 2 ? 'bg-amber-700 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                }`}>
                  {idx + 1}
                </span>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1 line-clamp-1">
                    {player.name}
                  </span>
                  <div className="flex items-center gap-2 opacity-60">
                    <span className="text-[10px] flex items-center gap-0.5"><Medal size={10} /> {player.badgesCount}</span>
                    <span className="text-[10px] flex items-center gap-0.5"><Zap size={10} /> {player.streak}d</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                  <div className="font-black text-indigo-600 dark:text-indigo-400 text-sm">{player.xp.toLocaleString()}</div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase">XP</div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <History className="mx-auto text-gray-200 mb-2" size={32} />
          <p className="text-gray-400 text-xs font-medium italic">Nenhum dado de ranking sincronizado.</p>
        </div>
      )}
    </div>
  );
}
