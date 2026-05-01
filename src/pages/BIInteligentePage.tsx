import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Cell, PieChart, Pie
} from 'recharts';
import { 
  TrendingUp, Users, Target, AlertTriangle, 
  RefreshCw, Database, Download, Filter 
} from 'lucide-react';
import { analyticsSupabaseService } from '../services/supabase/analyticsService';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export default function BIInteligentePage({ user, userProfile }: any) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compAverages, setCompAverages] = useState<any[]>([]);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);

  const isConfigured = isSupabaseConfigured;

  useEffect(() => {
    if (isConfigured) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isConfigured]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Tenta buscar dados reais baseados no perfil do usuário
      // Se não houver turma vinculada, usa demo para visualização inicial
      const targetTurma = userProfile?.turmaId || 'turma-demo';
      const targetAluno = userProfile?.role === 'STUDENT' ? user.uid : 'aluno-demo';

      const averages = await analyticsSupabaseService.getClassAverageByCompetency(targetTurma);
      const evolution = await analyticsSupabaseService.getStudentEvolution(targetAluno);
      
      setCompAverages(averages);
      setEvolutionData(evolution);
    } catch (err: any) {
      setError("Erro ao carregar dados analíticos. Verifique se as tabelas foram migradas para o Supabase.");
    } finally {
      setLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="p-8 text-center bg-amber-50 rounded-3xl border border-amber-100">
        <Database className="mx-auto text-amber-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-amber-900 mb-2">Supabase Não Configurado</h2>
        <p className="text-amber-800 text-sm">As novas funcionalidades analíticas requerem as chaves VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no seu ambiente.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">BI INTELIGENTE <span className="text-indigo-600">ULTRA</span></h1>
          <p className="text-gray-500 font-medium">Análise avançada de dados via Supabase/Postgres</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-gray-600">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            <Download size={18} />
            Exportar Relatório
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-3xl border border-gray-100"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Média Geral" value="82.5%" icon={<Target size={20} />} trend="+5.2%" color="text-emerald-600" />
          <StatCard title="Engajamento" value="94%" icon={<Users size={20} />} trend="+12%" color="text-indigo-600" />
          <StatCard title="Questões/Mês" value="1.2k" icon={<TrendingUp size={20} />} trend="+240" color="text-blue-600" />
          <StatCard title="Alertas Ativos" value="03" icon={<AlertTriangle size={20} />} trend="-2" color="text-rose-600" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Desempenho por Competência" subtitle="Média agregada de todas as avaliações da turma">
          <div className="w-full h-[320px] min-h-[320px]">
            {compAverages.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compAverages}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="competencia" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="media" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40}>
                    {compAverages.map((entry, index) => (
                      <Cell key={index} fill={entry.media < 60 ? '#ef4444' : entry.media < 80 ? '#f59e0b' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Sem dados de competência no Supabase ainda." />
            )}
          </div>
        </ChartCard>

        <ChartCard title="Evolução Temporal do Aprendizado" subtitle="Progresso individual ou da turma sugerido pelo BI">
          <div className="w-full h-[320px] min-h-[320px]">
            {evolutionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={4} dot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Inicie simulados para visualizar a evolução." />
            )}
          </div>
        </ChartCard>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-8">
        <h3 className="font-black text-gray-900 text-lg mb-6 flex items-center gap-2">
          <Database size={20} className="text-indigo-600" />
          Status das Novas Tabelas Analíticas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatusItem label="tentativas_simulado" status="Ativo" color="bg-emerald-500" />
          <StatusItem label="profiles_supabase" status="Sincronizado" color="bg-blue-500" />
          <StatusItem label="respostas_simulado" status="Processando" color="bg-amber-500" />
          <StatusItem label="analises_edu_jarvis" status="Ativo" color="bg-indigo-500" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }: any) {
  return (
    <motion.div whileHover={{ y: -4 }} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 bg-gray-50 rounded-2xl ${color}`}>{icon}</div>
        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{trend}</span>
      </div>
      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-2xl font-black text-gray-900">{value}</h4>
    </motion.div>
  );
}

function ChartCard({ title, subtitle, children }: any) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-full">
      <div className="mb-8">
        <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
        <p className="text-gray-500 text-sm font-medium">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
      <div className="p-4 bg-gray-50 rounded-full">
        <Filter size={32} />
      </div>
      <p className="font-medium text-sm text-center max-w-[200px]">{message}</p>
    </div>
  );
}

function StatusItem({ label, status, color }: any) {
  return (
    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
      <p className="text-[10px] font-black text-gray-400 uppercase mb-2 truncate">{label}</p>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-xs font-bold text-gray-700">{status}</span>
      </div>
    </div>
  );
}
