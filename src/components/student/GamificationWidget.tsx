import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, Target, Medal, ChevronRight, TrendingUp } from 'lucide-react';
import { gamificationEngine, GamificationProfile, XP_PER_LEVEL } from '../../services/gamificationService';
import { useAuth } from '../../contexts/AuthContext';

export const GamificationWidget: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      let data = await gamificationEngine.getProfile(user.uid);
      if (!data) {
        data = await gamificationEngine.createProfile(user.uid);
      }
      setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  if (loading || !profile) return (
    <div className="animate-pulse bg-white p-6 rounded-2xl border h-48" />
  );

  const nextLevelXP = XP_PER_LEVEL;
  const currentLevelXP = profile.experience % XP_PER_LEVEL;
  const progress = (currentLevelXP / nextLevelXP) * 100;

  const levelNames = [
    'Iniciante', 'Aprendiz', 'Explorador', 'Praticante', 'Avançado', 'Destaque'
  ];
  
  // Calculate a numeric level for older UI compatibility
  const numericLevel = typeof profile.level === 'number' 
    ? profile.level 
    : Math.floor(profile.experience / XP_PER_LEVEL) + 1;
    
  const levelTitle = levelNames[Math.min(levelNames.length - 1, Math.floor(numericLevel / 5))];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden"
    >
      <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Nível {numericLevel}</h3>
            <p className="text-xs text-emerald-100 opacity-80">{levelTitle}</p>
          </div>
        </div>
        <div className="bg-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
          {profile.experience} XP Total
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-gray-500">
            <span>Próximo nível: {(numericLevel + 1)}</span>
            <span>{currentLevelXP} / {nextLevelXP} XP</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            />
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 text-center">
            <Zap className="text-orange-500 mx-auto mb-1" size={18} />
            <div className="text-sm font-bold text-orange-700">{profile.streak}</div>
            <div className="text-[10px] text-orange-600 font-medium">Dias</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
            <Target className="text-blue-500 mx-auto mb-1" size={18} />
            <div className="text-sm font-bold text-blue-700">0</div>
            <div className="text-[10px] text-blue-600 font-medium">Missões</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-center">
            <Medal className="text-purple-500 mx-auto mb-1" size={18} />
            <div className="text-sm font-bold text-purple-700">{profile.achievements.length}</div>
            <div className="text-[10px] text-purple-600 font-medium">Conquistas</div>
          </div>
        </div>

        {/* Badges Preview */}
        {profile.achievements.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Conquistas Recentes</h4>
            <div className="flex gap-2">
              {profile.achievements.slice(0, 4).map((achievement, idx) => (
                <div key={idx} className="w-10 h-10 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center group cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all">
                  <Star size={16} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              ))}
              <div className="w-10 h-10 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold">
                +
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
