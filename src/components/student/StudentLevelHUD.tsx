import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Star, TrendingUp, Info } from 'lucide-react';
import { useGamification } from '../../services/useGamification';

interface StudentLevelHUDProps {
  userId: string;
}

const StudentLevelHUD: React.FC<StudentLevelHUDProps> = ({ userId }) => {
  const { profile, levelInfo, loading } = useGamification(userId);

  if (loading || !levelInfo) {
    return (
      <div className="animate-pulse bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-40">
        <div className="h-4 w-24 bg-slate-200 rounded mb-4"></div>
        <div className="h-8 w-48 bg-slate-200 rounded mb-4"></div>
        <div className="h-2 w-full bg-slate-200 rounded"></div>
      </div>
    );
  }

  const { current, next, progress } = levelInfo;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`${current.color} p-3 rounded-xl text-white shadow-lg shadow-current/20`}>
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nível Atual</p>
            <h3 className="text-2xl font-bold text-slate-900 leading-tight">{current.name}</h3>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-1 text-amber-500 mb-1">
            <Star className="w-4 h-4 fill-amber-500" />
            <span className="font-bold text-lg">{profile?.experience || 0} XP</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">Total Acumulado</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end text-sm">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            Progresso para o próximo nível
          </span>
          <span className="text-slate-900 font-bold">{Math.round(progress)}%</span>
        </div>
        
        <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`absolute top-0 left-0 h-full ${current.color} rounded-full shadow-[0_0_12px_rgba(0,0,0,0.1)]`}
          />
        </div>

        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 mt-4">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-400 mt-0.5" />
            <p className="text-xs text-slate-600 italic leading-relaxed">
              {current.description}
            </p>
          </div>
          {next && (
            <div className="ml-4 pl-4 border-l border-slate-200">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Próximo</p>
              <p className="text-xs font-bold text-slate-700 whitespace-nowrap">{next.name}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StudentLevelHUD;
