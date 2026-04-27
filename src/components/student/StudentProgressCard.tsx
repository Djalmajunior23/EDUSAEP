import React from 'react';
import { Target, BrainCircuit, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export function StudentProgressCard({ profile }: { profile: any }) {
  const engagementScore = profile?.engagementScore || 0; // 0-100

  const getEngagementLevel = (score: number) => {
    if (score >= 80) return { label: 'Alto', color: 'text-emerald-600', bg: 'bg-emerald-100' };
    if (score >= 50) return { label: 'Médio', color: 'text-amber-600', bg: 'bg-amber-100' };
    return { label: 'Baixo', color: 'text-rose-600', bg: 'bg-rose-100' };
  };

  const level = getEngagementLevel(engagementScore);

  return (
    <div className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Target className="text-indigo-600" /> Seu Progresso
        </h3>
        <div className={`px-3 py-1 rounded-full text-xs font-black uppercase ${level.bg} ${level.color}`}>
          Engajamento: {level.label}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm font-bold text-gray-700">
          <span>Jornada Atual</span>
          <span>{profile?.progress || 0}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000"
            style={{ width: `${profile?.progress || 0}%` }}
          />
        </div>
      </div>

      <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
        <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
          <BrainCircuit size={16} /> Próximos Passos Sugeridos
        </h4>
        <ul className="space-y-3">
          {profile?.suggestedSteps?.map((step: string, i: number) => (
            <li key={i} className="text-sm text-indigo-700 flex items-start gap-2">
              <Zap size={14} className="mt-1 shrink-0 text-indigo-500" />
              {step}
            </li>
          )) || <li className="text-sm text-indigo-500">Nenhuma sugestão no momento. Continue praticando!</li>}
        </ul>
      </div>
    </div>
  );
}
