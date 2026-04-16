import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Star, Zap, Target, Medal, Flame, Award, ChevronRight, Brain } from 'lucide-react';
import { calculateLevel, getXPForNextLevel } from '../../services/dashboardService';

export function StudentGamificationView({ userProfile }: { userProfile: any }) {
  const xp = userProfile.xp || 0;
  const level = calculateLevel(xp);
  const nextLevelXP = getXPForNextLevel(level);
  const currentLevelXP = getXPForNextLevel(level - 1);
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  const badges = [
    { id: '1', name: 'Explorador SAEP', icon: Target, color: 'bg-blue-500', desc: 'Realizou o primeiro simulado' },
    { id: '2', name: 'Mestre da Lógica', icon: Brain, color: 'bg-purple-500', desc: 'Acertou 10 questões de lógica seguidas' },
    { id: '3', name: 'Sempre Presente', icon: Flame, color: 'bg-orange-500', desc: 'Acessou a plataforma por 5 dias seguidos' },
    { id: '4', name: 'Colaborador Ativo', icon: Star, color: 'bg-emerald-500', desc: 'Postou 5 comentários no fórum' },
  ];

  const stats = [
    { label: 'Total XP', value: xp, icon: Zap, color: 'text-amber-500' },
    { label: 'Nível', value: level, icon: Trophy, color: 'text-indigo-500' },
    { label: 'Conquistas', value: '4/12', icon: Medal, color: 'text-emerald-500' },
    { label: 'Streak', value: '3 dias', icon: Flame, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Level Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Trophy size={200} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-white/20 flex items-center justify-center bg-white/10 backdrop-blur-md">
              <span className="text-5xl font-black">{level}</span>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-amber-400 text-indigo-900 p-2 rounded-lg shadow-lg">
              <Star size={20} fill="currentColor" />
            </div>
          </div>
          
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <h2 className="text-3xl font-black">Nível {level}</h2>
              <p className="text-indigo-100 font-medium">Você está no caminho para se tornar um Especialista!</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span>Progresso para o Nível {level + 1}</span>
                <span>{xp} / {nextLevelXP} XP</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden backdrop-blur-sm">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-2">
            <stat.icon className={stat.color} size={24} />
            <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Badges Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <Award className="text-indigo-600" /> Minhas Conquistas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {badges.map(badge => (
                <div key={badge.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-50 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group">
                  <div className={`w-12 h-12 rounded-xl ${badge.color} flex items-center justify-center text-white shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform`}>
                    <badge.icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{badge.name}</h4>
                    <p className="text-xs text-gray-500">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Next Goals */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <Zap className="text-amber-500" /> Próximas Metas
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-indigo-50 bg-indigo-50/30 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-indigo-900">Finalizar Simulado de Redes</h4>
                  <span className="text-[10px] font-black text-indigo-600">+200 XP</span>
                </div>
                <div className="w-full bg-indigo-100 rounded-full h-1.5">
                  <div className="w-2/3 h-full bg-indigo-600 rounded-full" />
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-emerald-50 bg-emerald-50/30 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-emerald-900">Responder 3 Fóruns</h4>
                  <span className="text-[10px] font-black text-emerald-600">+50 XP</span>
                </div>
                <div className="w-full bg-emerald-100 rounded-full h-1.5">
                  <div className="w-1/3 h-full bg-emerald-600 rounded-full" />
                </div>
              </div>

              <button className="w-full py-3 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                Ver todas as missões <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
