import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  Flame, 
  TrendingUp,
  Users,
  Medal,
  Crown
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export function Gamification() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      setUserProfile(doc.data());
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading || !userProfile) return null;

  const progress = ((userProfile.xp || 0) % 1000) / 10;

  const badges = [
    { id: 1, name: 'Pioneiro', icon: <Zap size={18} />, color: 'bg-blue-500', earned: true },
    { id: 2, name: 'Mestre do SAEP', icon: <Trophy size={18} />, color: 'bg-amber-500', earned: userProfile.xp > 5000 },
    { id: 3, name: 'Foco Total', icon: <Target size={18} />, color: 'bg-emerald-500', earned: userProfile.xp > 2000 },
    { id: 4, name: 'Colaborador', icon: <Users size={18} />, color: 'bg-purple-500', earned: false },
    { id: 5, name: 'Velocista', icon: <Flame size={18} />, color: 'bg-orange-500', earned: true },
  ];

  return (
    <div className="space-y-8">
      {/* Level & XP Card */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5 dark:opacity-10 pointer-events-none">
          <Crown size={120} />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-8 relative z-10">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-emerald-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-emerald-200 dark:shadow-none">
              {userProfile.level || 1}
            </div>
            <div className="absolute -bottom-2 -right-2 p-2 bg-amber-500 text-white rounded-xl shadow-lg">
              <Star size={16} fill="currentColor" />
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nível {userProfile.level || 1}</h3>
                <p className="text-sm text-gray-500">{userProfile.xp || 0} XP acumulados</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Próximo Nível</p>
                <p className="text-sm font-bold text-emerald-600">{1000 - ((userProfile.xp || 0) % 1000)} XP restantes</p>
              </div>
            </div>
            
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Simulados', value: '12', icon: <FileText size={18} />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Precisão', value: '84%', icon: <Target size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Ofensiva', value: '5 dias', icon: <Flame size={18} />, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Rank', value: '#12', icon: <TrendingUp size={18} />, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center">
            <div className={`p-3 ${stat.bg} ${stat.color} rounded-2xl mb-3`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Badges Section */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Medal className="text-amber-500" size={20} />
            Conquistas e Medalhas
          </h3>
          <button className="text-xs font-bold text-emerald-600 hover:underline">Ver todas</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {badges.map((badge) => (
            <div 
              key={badge.id} 
              className={`flex flex-col items-center group transition-all ${badge.earned ? 'opacity-100' : 'opacity-30 grayscale'}`}
            >
              <div className={`w-16 h-16 rounded-2xl ${badge.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                {badge.icon}
              </div>
              <p className="mt-3 text-xs font-bold text-gray-700 dark:text-gray-300">{badge.name}</p>
              {!badge.earned && <p className="text-[10px] text-gray-400 mt-1">Bloqueado</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard Preview */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Users className="text-blue-500" size={20} />
          Ranking da Turma
        </h3>
        <div className="space-y-4">
          {[
            { rank: 1, name: 'Ana Costa', xp: 12500, avatar: 'AC' },
            { rank: 2, name: 'Pedro Lima', xp: 11200, avatar: 'PL' },
            { rank: 3, name: 'Você', xp: userProfile.xp || 0, avatar: 'VC', isMe: true },
          ].map((user, i) => (
            <div 
              key={i} 
              className={`flex items-center justify-between p-4 rounded-2xl ${user.isMe ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800' : 'bg-gray-50 dark:bg-gray-800'}`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-6 text-center font-bold ${user.rank === 1 ? 'text-amber-500' : user.rank === 2 ? 'text-gray-400' : 'text-gray-500'}`}>
                  {user.rank}
                </span>
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center font-bold text-xs text-gray-500">
                  {user.avatar}
                </div>
                <span className={`text-sm font-bold ${user.isMe ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {user.name}
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-gray-500">{user.xp} XP</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { FileText } from 'lucide-react';
