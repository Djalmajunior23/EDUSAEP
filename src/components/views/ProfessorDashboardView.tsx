import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Users, BookOpen, TrendingUp, LayoutDashboard, 
  CheckSquare, Target, ArrowRight, Database, Brain, History, FolderPlus 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile } from '../../types';
import { ActivityManager } from '../professor/ActivityManager';
import { HeatmapLearning } from '../shared/HeatmapLearning';
import { RiskStudentsPanel } from '../analytics/RiskStudentsPanel';

interface ProfessorDashboardViewProps {
  user: User | null;
  userProfile: UserProfile | null;
}

export function ProfessorDashboardView({ user, userProfile }: ProfessorDashboardViewProps) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalExams: 0,
    avgScore: 0,
    recentActivity: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'activities' | 'heatmap'>('overview');

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const studentsQuery = query(collection(db, 'users'), where('role', '==', 'STUDENT'));
        const studentsSnap = await getDocs(studentsQuery);
        
        const diagQuery = query(collection(db, 'diagnostics'), orderBy('createdAt', 'desc'), limit(50));
        const diagSnap = await getDocs(diagQuery);
        const diags = diagSnap.docs.map(doc => doc.data());
        
        const totalExams = diags.length;
        const totalScore = diags.reduce((acc, curr) => acc + (curr.result?.summary?.acuracia_geral * 100 || 0), 0);
        const avgScore = totalExams > 0 ? totalScore / totalExams : 0;

        setStats({
          totalStudents: studentsSnap.size,
          totalExams,
          avgScore,
          recentActivity: diagSnap.docs.slice(0, 5).map(doc => ({ id: doc.id, ...doc.data() }))
        });
      } catch (err) {
        console.error("Error fetching professor stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);
  
  return (
    <div className="space-y-10 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Painel do Professor</h1>
          <p className="text-gray-500 dark:text-gray-400">Bem-vindo, {userProfile?.displayName || 'Professor'}. Gerencie suas turmas e simulados.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/input')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Novo Diagnóstico
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total de Alunos</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{loading ? '...' : stats.totalStudents}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Simulados Aplicados</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{loading ? '...' : stats.totalExams}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Média de Acertos</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{loading ? '...' : `${stats.avgScore.toFixed(1)}%`}</p>
          </div>
        </div>
      </div>

      {/* Módulo de IA Avançada */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-3xl p-8 text-white shadow-xl">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Brain size={24} className="text-purple-400" />
          Inteligência Pedagógica Avançada
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: 'copilot', label: 'Copiloto Pedagógico' },
            { id: 'gen-quest', label: 'Gerador de Questões' },
            { id: 'gen-discursive', label: 'Gerador Discursivas' },
            { id: 'gen-sa', label: 'Gerador de SA' },
            { id: 'observatory', label: 'Observatório Pedagógico' },
            { id: 'gen-material', label: 'Gerador Materiais' },
            { id: 'an-cogn', label: 'Análise Cognitiva' },
            { id: 'governance', label: 'Governança IA' },
          ].map(tool => (
            <button
              key={tool.id}
              onClick={() => {
                const map: any = {
                  'copilot': '/copilot',
                  'gen-quest': '/generate-questions',
                  'gen-discursive': '/generate-discursive',
                  'gen-sa': '/learning-situation',
                  'observatory': '/observatory',
                  'gen-material': '/teacher-ai-assistant',
                  'an-cogn': '/cognitive-analysis',
                  'governance': '/ai-governance'
                };
                navigate(map[tool.id]);
              }}
              className="bg-white/10 hover:bg-white/20 transition-all p-4 rounded-xl text-center text-sm font-bold border border-white/10"
            >
              {tool.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 p-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl w-fit">
        {[
          { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
          { id: 'activities', label: 'Atividades', icon: CheckSquare },
          { id: 'heatmap', label: 'Monitoramento Heatmap', icon: Target }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === tab.id 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none' 
                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {React.createElement(tab.icon, { size: 16 })}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <LayoutDashboard size={20} className="text-emerald-600" />
                Ações Rápidas
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/exams')}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-4"
                >
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Gestão de Simulados</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Crie e gerencie avaliações padrão SAEP.</p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-emerald-600 text-xs font-bold">
                    Gerenciar <ArrowRight size={14} />
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/questions-bank')}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-4"
                >
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                    <Database size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Banco de Questões</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Acesse e organize questões por competência.</p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-blue-600 text-xs font-bold">
                    Acessar <ArrowRight size={14} />
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/resources')}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-4"
                >
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                    <FolderPlus size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Recursos Didáticos</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Organize slides, PDFs e materiais de apoio.</p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-amber-600 text-xs font-bold">
                    Gerenciar <ArrowRight size={14} />
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/cognitive-analysis')}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-4"
                >
                  <div className="w-12 h-12 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center">
                    <Brain size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Erros Cognitivos</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Análise profunda das dificuldades dos alunos.</p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-rose-600 text-xs font-bold">
                    Analisar <ArrowRight size={14} />
                  </div>
                </motion.button>
              </div>
            </div>

            <div className="space-y-6">
              <RiskStudentsPanel />
              
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <History size={20} className="text-emerald-600" />
                Atividade Recente
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Carregando atividade...</p>
                  </div>
                ) : stats.recentActivity.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 italic text-sm">
                    Nenhuma atividade recente encontrada.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {stats.recentActivity.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => navigate(`/aluno/${item.id}`)}
                        className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">{item.aluno}</p>
                          <p className="text-[10px] text-gray-500">{item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-emerald-600">{(item.result?.summary?.acuracia_geral * 100)?.toFixed(1)}%</p>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Acerto</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <button 
                  onClick={() => navigate('/history')}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700/50 text-xs font-bold text-gray-500 hover:text-emerald-600 transition-colors border-t border-gray-100 dark:border-gray-700"
                >
                  Ver Histórico Completo
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'activities' && (
          <motion.div key="activities" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ActivityManager />
          </motion.div>
        )}

        {activeSubTab === 'heatmap' && (
          <motion.div key="heatmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <HeatmapLearning />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
