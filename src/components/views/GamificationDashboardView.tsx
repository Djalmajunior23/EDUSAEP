import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Star, Zap, Target, Medal, ChevronRight, Award, Flame } from 'lucide-react';
import { gamificationService, ACHIEVEMENTS } from '../../services/gamificationService';
import { useAuth } from '../../contexts/AuthContext';
import { GamificationProfile } from '../../types';
import { cn } from '../../lib/utils';

export function GamificationDashboardView() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      gamificationService.getProfile(user.uid).then(p => {
        setProfile(p);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const nextLevelExp = Math.pow(profile?.level || 1, 2) * 100;
  const currentLevelExp = Math.pow((profile?.level || 1) - 1, 2) * 100;
  const progress = ((profile?.experience || 0) - currentLevelExp) / (nextLevelExp - currentLevelExp) * 100;

  return (
    <div className="space-y-8 pb-20">
      {/* Header Profile Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Trophy size={160} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white/30 overflow-hidden bg-white/10 flex items-center justify-center text-4xl font-black">
              {profile?.level}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-amber-400 text-amber-900 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-lg">
              LVL
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-black mb-1">Olá, {user?.displayName}!</h2>
            <p className="text-indigo-100 font-medium opacity-80 mb-4">Seu progresso pedagógico está acelerado.</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <span>XP: {profile?.experience} / {nextLevelExp}</span>
                <span>{Math.round(progress)}% para o nível { (profile?.level || 1) + 1 }</span>
              </div>
              <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden border border-white/10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-amber-300 to-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center min-w-[100px]">
              <div className="text-amber-400 mb-1 flex justify-center"><Star size={20} fill="currentColor" /></div>
              <div className="text-2xl font-black">{profile?.points}</div>
              <div className="text-[10px] font-bold uppercase opacity-60">Pontos</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center min-w-[100px]">
              <div className="text-orange-400 mb-1 flex justify-center"><Flame size={20} fill="currentColor" /></div>
              <div className="text-2xl font-black">{profile?.streak}</div>
              <div className="text-[10px] font-bold uppercase opacity-60">Dias Seguindo</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Achievements Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Award className="text-amber-500" /> Suas Conquistas
            </h3>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {profile?.achievements.length} / {ACHIEVEMENTS.length} Desbloqueadas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ACHIEVEMENTS.map((achievement) => {
              const isUnlocked = profile?.achievements.includes(achievement.id);
              return (
                <motion.div 
                  key={achievement.id}
                  whileHover={{ y: -5 }}
                  className={cn(
                    "p-5 rounded-2xl border transition-all flex items-center gap-4",
                    isUnlocked 
                      ? "bg-white border-amber-200 shadow-sm" 
                      : "bg-gray-50 border-gray-100 grayscale opacity-60"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-inner",
                    isUnlocked ? "bg-amber-100" : "bg-gray-200"
                  )}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{achievement.title}</h4>
                    <p className="text-xs text-gray-500 leading-tight">{achievement.description}</p>
                  </div>
                  {isUnlocked && (
                    <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                      <Medal size={14} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Missions & Targets */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Target className="text-indigo-600" /> Missões Ativas
          </h3>
          
          <div className="space-y-4">
            {[
              { title: 'Primeiro Quiz', desc: 'Responda um quiz interativo rápido.', reward: '+50 XP', progress: 0 },
              { title: 'Estudante Ativo', desc: 'Conclua 3 tópicos do seu trilho hoje.', reward: '+100 XP', progress: 66 },
              { title: 'Foco Total', desc: 'Estude por 30 minutos ininterruptos.', reward: '+30 XP', progress: 20 }
            ].map((mission, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900">{mission.title}</h4>
                    <p className="text-xs text-gray-500">{mission.desc}</p>
                  </div>
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                    {mission.reward}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400">
                    <span>PROGRESSO</span>
                    <span>{mission.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${mission.progress}%` }}
                      className="h-full bg-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
