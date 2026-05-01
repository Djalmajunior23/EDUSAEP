import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Medal, Target, Zap, 
  ChevronRight, Star, Award, TrendingUp, History
} from 'lucide-react';
import { gamificationSupabaseService } from '../services/supabase/gamificationService';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export default function GamificacaoPage() {
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<any[]>([]);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (isConfigured) {
      loadGamification();
    } else {
      setLoading(false);
    }
  }, [isConfigured]);

  const loadGamification = async () => {
    setLoading(true);
    try {
      const data = await gamificationSupabaseService.getRanking();
      setRanking(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-3xl border border-gray-100">
        <Award className="mx-auto text-gray-300 mb-4" size={48} />
        <h2 className="text-xl font-bold text-gray-900">Gamificação Indisponível</h2>
        <p className="text-gray-500 mt-2">Ative o Supabase para gerenciar conquistas, pontos e rankings saudáveis.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 min-h-screen bg-[#fafafa]">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">GAMIFICAÇÃO & <span className="text-amber-500">CONQUISTAS</span></h1>
          <p className="text-gray-500 font-medium italic">Evolução acelerada por missões pedagógicas</p>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-2 flex items-center gap-2 border-r border-gray-100">
            <Star className="text-amber-500 fill-amber-500" size={18} />
            <span className="font-black text-gray-900">2.450 XP</span>
          </div>
          <div className="px-4 py-2 flex items-center gap-2">
            <Trophy className="text-indigo-600" size={18} />
            <span className="font-black text-gray-900">Nível 12</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Missions Column */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap size={20} className="text-amber-500" /> 
              Missões Ativas
            </h3>
            <div className="space-y-4">
              <MissionItem title="Mestre do SAEP" desc="Acerte 10 questões seguidas de lógica." progress={70} reward="500 XP" />
              <MissionItem title="Frequência Total" desc="Acesse o tutor por 5 dias seguidos." progress={40} reward="200 XP" />
              <MissionItem title="Crítico de IA" desc="Dê feedback em 5 recomendações da IA." progress={100} reward="Completado!" completed />
            </div>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Medal size={20} className="text-indigo-600" /> 
              Galeria de Medalhas (Supabase)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MedalIcon name="Pioneiro" slug="pioneer" unlocked color="bg-emerald-500" />
              <MedalIcon name="Veloz" slug="speed" unlocked color="bg-blue-500" />
              <MedalIcon name="Resiliente" slug="resilient" color="bg-gray-200" />
              <MedalIcon name="Arquiteto" slug="architect" color="bg-gray-200" />
            </div>
          </section>
        </div>

        {/* Ranking Column */}
        <div>
          <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm sticky top-6">
            <h3 className="font-black text-gray-900 text-lg mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-500" />
              Ranking Pedagógico
            </h3>
            
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl"></div>)}
              </div>
            ) : ranking.length > 0 ? (
              <div className="space-y-3">
                {ranking.map((player, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3 rounded-2xl transition-all ${idx < 3 ? 'bg-amber-50/50' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black ${
                        idx === 0 ? 'bg-amber-500 text-white' : 
                        idx === 1 ? 'bg-gray-400 text-white' : 
                        idx === 2 ? 'bg-amber-700 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-bold text-gray-700 text-sm">{player.nome}</span>
                    </div>
                    <span className="font-black text-gray-900 text-xs">{player.total} XP</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <History className="mx-auto text-gray-200 mb-2" size={32} />
                <p className="text-gray-400 text-xs font-medium italic">Nenhum dado de ranking sincronizado ainda.</p>
              </div>
            )}
            
            <button className="w-full mt-8 py-3 bg-gray-50 text-gray-600 rounded-2xl text-xs font-bold hover:bg-gray-100 transition-all">
              Ver Ranking Completo
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function MissionItem({ title, desc, progress, reward, completed }: any) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between group hover:border-amber-200 transition-all cursor-pointer">
      <div className="flex-1 pr-4">
        <h4 className="font-bold text-gray-900 text-sm mb-0.5">{title}</h4>
        <p className="text-xs text-gray-500 font-medium mb-3">{desc}</p>
        <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${completed ? 'bg-emerald-500' : 'bg-amber-400'}`} 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${completed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
          {reward}
        </span>
        <ChevronRight size={16} className="text-gray-300 group-hover:text-amber-500 transition-all" />
      </div>
    </div>
  );
}

function MedalIcon({ name, unlocked, color }: any) {
  return (
    <div className="flex flex-col items-center gap-2 p-4">
      <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-lg ${unlocked ? color : 'grayscale opacity-30 bg-gray-200'}`}>
        <Award size={32} />
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${unlocked ? 'text-gray-700' : 'text-gray-300'}`}>
        {name}
      </span>
    </div>
  );
}
