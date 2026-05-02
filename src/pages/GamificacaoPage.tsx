import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Medal, Target, Zap, 
  ChevronRight, Star, Award, TrendingUp, History, User
} from 'lucide-react';
import { gamificationSupabaseService } from '../services/supabase/gamificationService';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function GamificacaoPage() {
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<any[]>([]);
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<any>(null);

  const isConfigured = isSupabaseConfigured;

  useEffect(() => {
    if (isConfigured) {
      loadGamification();
    } else {
      setLoading(false);
    }
  }, [isConfigured, user]);

  const loadGamification = async () => {
    setLoading(true);
    try {
      const data = await gamificationSupabaseService.getRanking();
      setRanking(data || []);
      
      // Compute user stats if needed from Supabase or just fallback
      const meItem = (data || []).find((d: any) => d.id === user?.uid);
      if (meItem) {
        setUserStats({ xp: meItem.total, level: Math.floor(meItem.total / 1000) + 1 });
      } else {
        setUserStats({ xp: 0, level: 1 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Em vez de quebrar a página, mostramos um aviso não obstrutivo pra manter a interface e não dar impressão de crash
  /*
  if (!isConfigured) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-3xl border border-gray-100 mt-10">
        <Award className="mx-auto text-gray-300 mb-4" size={48} />
        <h2 className="text-xl font-bold text-gray-900">Supabase Não Configurado</h2>
        <p className="text-gray-500 mt-2">Ative as credenciais do Supabase no Menu de Configuração para gerenciar ranking e gamificação.</p>
      </div>
    );
  }
  */

  return (
    <div className="p-6 space-y-8 min-h-screen bg-[#fafafa]">
      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4">
          <Award className="text-amber-500 shrink-0 mt-1" size={24} />
          <div>
            <h3 className="text-amber-900 font-bold text-sm">Modo de Demonstração</h3>
            <p className="text-amber-800 text-xs mt-1">
              As funcionalidades em tempo real de gamificação requerem as chaves <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> e <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code>.
            </p>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">GAMIFICAÇÃO & <span className="text-amber-500">CONQUISTAS</span></h1>
          <p className="text-gray-500 font-medium italic">Evolução acelerada por missões pedagógicas</p>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-2 flex items-center gap-2 border-r border-gray-100">
            <Star className="text-amber-500 fill-amber-500" size={18} />
            <span className="font-black text-gray-900">{userStats?.xp || 0} XP</span>
          </div>
          <div className="px-4 py-2 flex items-center gap-2">
            <Trophy className="text-indigo-600" size={18} />
            <span className="font-black text-gray-900">Nível {userStats?.level || 1}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Missions Column */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
                <h3 className="text-lg font-black uppercase tracking-tighter mb-1">Status de Flow: <span className="bg-white/20 px-2 py-0.5 rounded">OTIMIZADO</span></h3>
                <p className="text-xs font-medium opacity-90 mb-4">A IA adaptou os desafios para o seu nível atual (Dificuldade Intermediária).</p>
                <div className="flex gap-4">
                    <div className="bg-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                        <Zap size={16} />
                        <span className="text-sm font-bold">X3 Streak ativa</span>
                    </div>
                    <div className="bg-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                        <TrendingUp size={16} />
                        <span className="text-sm font-bold">Próximo Boss em 20 XP</span>
                    </div>
                </div>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12">
                <Trophy size={200} />
            </div>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Zap size={20} className="text-amber-500" /> 
                Missões Ativas (IA Adaptive)
              </div>
              <span className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded-full font-black animate-pulse">EDUJARVIS ACTIVE</span>
            </h3>
            <div className="space-y-4">
              <MissionItem title="Mestre do SAEP" desc="Desafio de lógica gerado pelo seu DNA Pedagógico." progress={70} reward="500 XP" />
              <MissionItem title="Consistência Ultra" desc="Acesse o tutor por 5 dias seguidos." progress={40} reward="200 XP" />
              <MissionItem title="Feedback Pro" desc="Valide uma resposta da IA." progress={100} reward="Completado!" completed />
            </div>
          </section>

          <section className="bg-gray-900 rounded-3xl p-8 text-white">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                <Medal size={24} className="text-indigo-400" />
                Sistema de Recompensas Ultra
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Ganhos de XP</h4>
                    <ul className="space-y-3">
                        <li className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                            <span>Acerto Simples</span>
                            <span className="font-black text-emerald-400">+10 XP</span>
                        </li>
                        <li className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                            <span>Superação (Adaptativo)</span>
                            <span className="font-black text-emerald-400">+20 XP</span>
                        </li>
                        <li className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                            <span>Boss Fight Final</span>
                            <span className="font-black text-emerald-400">+200 XP</span>
                        </li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Multiplicadores</h4>
                    <ul className="space-y-3">
                        <li className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                            <span>Streak (3+ acertos)</span>
                            <span className="font-black text-amber-400">1.2x</span>
                        </li>
                        <li className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                            <span>Colaboração Master</span>
                            <span className="font-black text-amber-400">1.5x</span>
                        </li>
                        <li className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                            <span>Madrugada (Foco)</span>
                            <span className="font-black text-amber-400">1.1x</span>
                        </li>
                    </ul>
                </div>
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
            ) : ranking?.length > 0 ? (
              <div className="space-y-3">
                {ranking.map((player, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3 rounded-2xl transition-all ${player.userId === user?.uid ? 'bg-indigo-50 border border-indigo-100' : idx < 3 ? 'bg-amber-50/30' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black ${
                        idx === 0 ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 
                        idx === 1 ? 'bg-gray-400 text-white' : 
                        idx === 2 ? 'bg-amber-700 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-sm flex items-center gap-1">
                          {player.name}
                          {player.userId === user?.uid && <span className="text-[8px] bg-indigo-600 text-white px-1 rounded">VOCÊ</span>}
                        </span>
                        <div className="flex items-center gap-2 opacity-60">
                          <span className="text-[10px] flex items-center gap-0.5"><Medal size={10} /> {player.badgesCount}</span>
                          <span className="text-[10px] flex items-center gap-0.5"><Zap size={10} /> {player.streak}d</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                        <div className="font-black text-indigo-600 text-sm">{player.xp.toLocaleString()}</div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase">XP TOTAL</div>
                    </div>
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
