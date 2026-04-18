import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { 
  Users, FileText, Target, TrendingUp, AlertTriangle, CheckCircle, 
  Filter, Calendar, BookOpen, GraduationCap, ArrowUpRight, ArrowDownRight, Sparkles, Zap,
  Brain, Shield, Layout, Settings, Loader2, X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ProfessorInsights } from './ProfessorInsights';
import { PainelInsightsIA } from './PainelInsightsIA';
import { PedagogicalRecommendations } from './PedagogicalRecommendations';
import { DigitalTwinCard } from './DigitalTwinCard';
import { DigitalTwinExplorer } from './DigitalTwinExplorer';
import { SystemGovernancePortal } from './SystemGovernancePortal';
import { UserProfile } from '../../App';
import { toast } from 'sonner';
import { generateClassRecoveryOrchestration, ClassOrchestrationResult, generateSIPA, SIPAResult } from '../../services/geminiService';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface DashboardProps {
  userProfile: UserProfile | null;
  selectedModel: string;
  stats: {
    totalStudents: number;
    totalExams: number;
    averageScore: number;
    successRate: number;
    evolutionRate: number;
    criticalCompetencies: string[];
    riskClusters: { name: string; count: number; description: string; }[];
  };
  disciplinePerformance: any[];
  studentEvolution: any[];
  competencyDistribution: any[];
  classComparison: any[];
}

export function AdvancedDashboard({ userProfile, selectedModel, stats, disciplinePerformance, studentEvolution, competencyDistribution, classComparison }: DashboardProps) {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'simulation' | 'governance'>('overview');
  const [isGeneratingPath, setIsGeneratingPath] = React.useState(false);
  const [isIntervening, setIsIntervening] = React.useState(false);
  const [isSimulatingImpact, setIsSimulatingImpact] = React.useState(false);
  const [orchestrationResult, setOrchestrationResult] = React.useState<ClassOrchestrationResult | null>(null);
  const [sipaResult, setSipaResult] = React.useState<SIPAResult | null>(null);

  const handleGenerateLearningPath = async () => {
    setIsGeneratingPath(true);
    try {
      const result = await generateClassRecoveryOrchestration(stats, selectedModel);
      setOrchestrationResult(result);
      toast.success('Trilhas personalizadas geradas com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Falha ao orquestrar trilhas.');
    } finally {
      setIsGeneratingPath(false);
    }
  };

  const handleInterveneCritical = async () => {
    setIsIntervening(true);
    try {
      // Use existing SIPA logic or similar
      const criticalStudents = stats.riskClusters.find(c => c.name === 'Crítico' || c.name === 'Risco Elevado')?.count || 0;
      if (criticalStudents === 0) {
        toast.info('Nenhum aluno em nível crítico detectado no momento.');
        return;
      }
      
      toast.loading('Iniciando protocolos de contenção...', { id: 'intervene' });
      
      // Simulate/Trigger SIPA for critical students
      // In a real scenario, we would pass student data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Protocolos disparados para os ${criticalStudents} alunos críticos.`, { id: 'intervene' });
    } catch (error) {
      toast.error('Erro ao disparar protocolos.', { id: 'intervene' });
    } finally {
      setIsIntervening(false);
    }
  };

  const handleSimulateSIPA = async (interventionText: string) => {
    setIsSimulatingImpact(true);
    try {
      const result = await generateSIPA(stats, interventionText, selectedModel);
      setSipaResult(result);
      toast.success('Simulação de impacto concluída!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao simular impacto.');
    } finally {
      setIsSimulatingImpact(false);
    }
  };

  const mockStudentData = useMemo(() => ({
    performance: disciplinePerformance,
    evolution: studentEvolution,
    competencies: stats.criticalCompetencies,
    recentActivity: [
      { type: 'exam', score: 0.45, date: '2024-03-20' },
      { type: 'exercise', score: 0.60, date: '2024-03-22' }
    ]
  }), [disciplinePerformance, studentEvolution, stats.criticalCompetencies]);

  return (
    <div className="space-y-8 p-4 md:p-8 bg-gray-50/50 min-h-screen relative overflow-hidden font-sans">
      {/* Visual background accents: Command Room Feel */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.05] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50/50 via-transparent to-transparent" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="px-2 py-1 bg-white border border-indigo-200 text-indigo-700 rounded shadow-sm flex items-center gap-1.5 ring-1 ring-indigo-50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">SALA ATIVA</span>
            </div>
            <div className="px-2 py-1 bg-white border border-emerald-200 text-emerald-700 rounded shadow-sm flex items-center gap-1.5">
              <Brain size={12} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{selectedModel}</span>
            </div>
            <div className="px-2 py-1 bg-white border border-indigo-200 text-indigo-700 rounded shadow-sm flex items-center gap-1.5">
              <Settings size={12} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">V2.4.0</span>
            </div>
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter flex items-center gap-2">
            Sala de Comando <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Pedagógico</span>
          </h1>
          <p className="text-gray-500 font-medium tracking-tight text-lg mt-1">Inteligência Preditiva e Orquestração de Intervenções.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden xl:flex items-center gap-3 mr-4 py-2 px-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Próxima Aula</p>
              <p className="text-sm font-bold text-gray-900">Seg, 08:30 • TRI Intermediário</p>
            </div>
            <Calendar className="text-indigo-500" size={20} />
          </div>
          <button className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm group">
            <Filter size={20} className="group-hover:rotate-180 transition-transform" />
          </button>
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl active:scale-95",
              activeTab === 'overview' ? "bg-gray-900 text-white shadow-gray-200" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            <Layout size={18} /> Painel Geral
          </button>
          <button 
            onClick={() => setActiveTab('simulation')}
            className={cn(
              "px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl active:scale-95",
              activeTab === 'simulation' ? "bg-indigo-600 text-white shadow-indigo-200" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            <Brain size={18} /> Sala de Guerra
          </button>
          <button 
            onClick={() => setActiveTab('governance')}
            className={cn(
              "px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl active:scale-95",
              activeTab === 'governance' ? "bg-slate-700 text-white shadow-slate-200" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            <Shield size={18} /> Backstage
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 font-sans"
          >
            {/* Left Col: Prediction & Recommendations (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-2">
                    <Brain size={14} /> Gêmeo Digital Pedagógico
                  </h3>
                  <div className="h-px flex-1 mx-4 bg-gray-200" />
                </div>
                <DigitalTwinCard studentData={mockStudentData} selectedModel={selectedModel} />
              </section>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-2">
                    <Target size={14} /> Recomendações Prioritárias
                  </h3>
                  <div className="h-px flex-1 mx-4 bg-gray-200" />
                </div>
                <PedagogicalRecommendations userProfile={userProfile} />
              </div>

              {/* Intervention Engine */}
              <section className="bg-white p-10 rounded-[32px] shadow-2xl shadow-indigo-100/50 border border-indigo-100 relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-500">
                  <Zap size={240} className="text-indigo-600" />
                </div>
                
                <div className="relative z-10 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-100 shadow-sm">
                    <Sparkles size={12} /> ENGINE DE REMEDIAÇÃO ATIVA
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2 leading-tight">
                    Intervenção em Tempo Real
                  </h2>
                  <p className="text-gray-500 font-medium mb-10 max-w-xl">
                    O motor de resposta EduDiagnóstico orquestra automaticamente rotas de aprendizagem e protocolos de apoio para alunos em risco.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <button 
                      onClick={handleGenerateLearningPath}
                      disabled={isGeneratingPath}
                      className="group flex flex-col items-center sm:items-start p-8 bg-indigo-600 text-white rounded-[24px] hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-200 hover:-translate-y-1 transition-all text-left relative overflow-hidden disabled:opacity-50"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-125 transition-transform duration-500">
                        <Sparkles size={64} />
                      </div>
                      <div className="p-3 bg-white/20 rounded-2xl mb-6 backdrop-blur-sm border border-white/20">
                        {isGeneratingPath ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                      </div>
                      <span className="font-black text-xl mb-2">Orquestrar Trilhas</span>
                      <p className="text-indigo-100 text-sm font-medium leading-relaxed opacity-80">
                        Cria rotas adaptativas baseadas em micro-diagnósticos e gaps cognitivos.
                      </p>
                      <div className="mt-6 flex items-center gap-2 text-xs font-bold text-indigo-200 border-t border-white/10 pt-4 w-full group-hover:text-white transition-colors">
                        Duração Estimada: 2min <ArrowUpRight size={14} />
                      </div>
                    </button>
                    
                    <button 
                      onClick={handleInterveneCritical}
                      disabled={isIntervening}
                      className="group flex flex-col items-center sm:items-start p-8 bg-white text-gray-900 rounded-[24px] border-2 border-amber-500/10 hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-100 hover:-translate-y-1 transition-all text-left relative overflow-hidden disabled:opacity-50"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-125 transition-transform duration-500">
                        <AlertTriangle size={64} className="text-amber-600" />
                      </div>
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl mb-6 border border-amber-100">
                        {isIntervening ? <Loader2 className="animate-spin" size={24} /> : <AlertTriangle size={24} />}
                      </div>
                      <span className="font-black text-xl mb-2">Contenção Crítica</span>
                      <p className="text-gray-500 text-sm font-medium leading-relaxed opacity-80">
                        Notificações em massa para tutores, pais e suporte pedagógico.
                      </p>
                      <div className="mt-6 flex items-center gap-2 text-xs font-bold text-amber-600 border-t border-amber-50 pt-4 w-full">
                        {stats.riskClusters.find(c => c.name === 'Crítico' || c.name === 'Risco Elevado')?.count || 0} Alunos Alvo <ArrowUpRight size={14} />
                      </div>
                    </button>
                  </div>
                </div>
              </section>

              {/* Orchestration Results Display */}
              <AnimatePresence>
                {orchestrationResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-10 rounded-[40px] border border-indigo-100 shadow-2xl relative overflow-hidden my-8"
                  >
                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className="p-4 bg-indigo-600 text-white rounded-[24px] shadow-lg shadow-indigo-200">
                            <Target size={28} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Orquestração de Trilhas</h3>
                            <p className="text-xs text-indigo-500 font-black uppercase tracking-widest">Motor EduDiagnóstico • Ativo</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setOrchestrationResult(null)}
                          className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="bg-indigo-50/50 p-8 rounded-[32px] border border-indigo-100 mb-10">
                        <h4 className="text-sm font-black text-indigo-900 mb-3 flex items-center gap-2 uppercase tracking-tight">
                          <Brain size={18} className="text-indigo-600" /> Estratégia de Macro-Remediação
                        </h4>
                        <p className="text-lg text-indigo-950 leading-relaxed font-semibold">
                          {orchestrationResult.overallStrategy}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {orchestrationResult.tracks.map((track, idx) => (
                          <div key={idx} className="group relative p-8 rounded-[32px] border border-gray-100 bg-gray-50/40 hover:bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                <h5 className="font-black text-lg text-gray-900 mb-1">{track.groupName}</h5>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    {track.studentCount} ALUNOS
                                  </span>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                    track.riskLevel === 'Crítico' ? "bg-red-100 text-red-700" :
                                    track.riskLevel === 'Alto' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                                  )}>
                                    {track.riskLevel}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mb-6">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Foco Competencial</p>
                              <div className="p-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-900 shadow-sm">
                                {track.focusCompetency}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Passos da Trilha</p>
                              {track.activities.map((activity, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm text-gray-600 bg-white p-3 rounded-2xl border border-gray-100 group-hover:border-indigo-100 transition-colors shadow-sm">
                                  <div className="mt-0.5 p-1 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <CheckCircle size={10} />
                                  </div>
                                  <span className="font-medium">{activity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Col: High-Res Analytics (4 cols) */}
            <div className="lg:col-span-4 space-y-8">
              <section className="bg-white p-8 rounded-[32px] shadow-xl border border-red-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 cursor-default opacity-[0.03] -translate-y-16 translate-x-16 rounded-full" />
                <h3 className="font-black text-xl mb-8 text-gray-900 flex items-center gap-2">
                  <AlertTriangle size={24} className="text-red-600" /> Radar de Vulnerabilidade
                </h3>
                
                <div className="space-y-6">
                  {stats.riskClusters.map((cluster, i) => (
                    <div key={i} className="group relative">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-black text-gray-900 text-sm">{cluster.name}</p>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-600 shadow-sm transition-transform group-hover:scale-110",
                          cluster.name === 'Avançados' && 'bg-emerald-100 text-emerald-600'
                        )}>
                          {cluster.count} Alunos
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                        <div 
                          className={cn(
                            "h-2 rounded-full transition-all duration-1000 ease-out",
                            cluster.name === 'Risco Elevado' ? 'bg-red-600' : 
                            cluster.name === 'Em Atenção' ? 'bg-amber-500' : 'bg-emerald-500'
                          )} 
                          style={{ width: `${(cluster.count / stats.totalStudents) * 100}%` }} 
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{cluster.description}</p>
                    </div>
                  ))}
                </div>
                
                <button className="w-full mt-10 py-4 bg-red-600 text-white rounded-2xl font-black text-sm hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-100 active:scale-95 group">
                  <Shield size={20} className="group-hover:animate-bounce" /> ATIVAR PROTOCOLO DE APOIO
                </button>
              </section>

              <section className="bg-gray-900 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden border border-white/5">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,#4f46e522,transparent)]" />
                
                <div className="relative z-10">
                  <h3 className="font-black text-lg mb-8 flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/20">
                      <Brain size={20} className="text-indigo-400" />
                    </div>
                    Rede de Inteligência SAEP
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-4 transition-all hover:bg-white/[0.08]">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-indigo-300 font-bold uppercase tracking-[0.15em]">Gaps Estruturais</span>
                        <span className="font-mono text-emerald-400">98% Synced</span>
                      </div>
                      <div className="flex -space-x-3 overflow-hidden">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-gray-900 bg-gray-800 flex items-center justify-center text-[10px] font-black border border-white/10">
                            IA{i}
                          </div>
                        ))}
                        <div className="inline-block h-8 w-8 rounded-full ring-2 ring-gray-900 bg-emerald-600 flex items-center justify-center text-[10px] font-black">
                          +16
                        </div>
                      </div>
                      <div className="pt-2 border-t border-white/5">
                        <p className="text-[10px] text-indigo-200/50 italic leading-relaxed font-medium">
                          Modelos de regressão processando {stats.totalExams * 24} pontos de dados para refinamento do mapa de calor.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-center">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Threads</p>
                        <p className="text-xl font-black font-mono">1.2k</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-center">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-xl font-black">OK</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        )}

        {activeTab === 'simulation' && (
          <motion.div
            key="simulation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <DigitalTwinExplorer stats={stats} selectedModel={selectedModel} />
          </motion.div>
        )}

        {activeTab === 'governance' && (
          <motion.div
            key="governance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <SystemGovernancePortal />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-px w-full bg-gray-200 my-8" />

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard 
            title="Total de Alunos" 
            value={stats.totalStudents} 
            icon={<Users size={24} />} 
            trend="+5%" 
            trendType="up"
            color="blue"
          />
          <KpiCard 
            title="Simulados Realizados" 
            value={stats.totalExams} 
            icon={<FileText size={24} />} 
            trend="+12%" 
            trendType="up"
            color="emerald"
          />
          <KpiCard 
            title="Média Geral" 
            value={`${(stats.averageScore * 100).toFixed(1)}%`} 
            icon={<Target size={24} />} 
            trend="-2%" 
            trendType="down"
            color="amber"
          />
          <KpiCard 
            title="Taxa de Sucesso" 
            value={`${(stats.successRate * 100).toFixed(1)}%`} 
            icon={<CheckCircle size={24} />} 
            trend="+8%" 
            trendType="up"
            color="indigo"
          />
        </div>
      )}

      {/* SIPA Simulator Section */}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance by Discipline */}
        <ChartCard title="Desempenho por Disciplina" subtitle="Média de acertos por unidade curricular">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={disciplinePerformance}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Student Evolution */}
        <ChartCard title="Evolução Temporal" subtitle="Progresso médio da turma ao longo do semestre">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={studentEvolution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* SIPA Simulator Section */}
      <section className="bg-gradient-to-br from-indigo-900 to-slate-900 p-10 rounded-[40px] shadow-2xl border border-indigo-500/30 relative overflow-hidden group mt-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-400/30">
              <Zap className="text-indigo-300" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">SIPA: Simulador de Impacto Pedagógico</h3>
              <p className="text-indigo-200/60 text-xs font-bold uppercase tracking-widest">IA Preditiva de Resultados</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <p className="text-indigo-100/80 text-sm leading-relaxed font-medium">
                Descreva uma intervenção pedagógica (ex: "Aula de reforço sobre Geometria Espacial focada em prismas") para simular o impacto esperado no desempenho da turma.
              </p>
              <div className="relative">
                <textarea 
                  placeholder="Ex: Intensivão de interpretação de texto com foco em descritores críticos..."
                  className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-white/20 min-h-[120px]"
                  id="sipa-input"
                />
                <button 
                  onClick={() => {
                    const val = (document.getElementById('sipa-input') as HTMLTextAreaElement).value;
                    handleSimulateSIPA(val);
                  }}
                  disabled={isSimulatingImpact}
                  className="absolute bottom-4 right-4 p-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl shadow-lg transition-all disabled:opacity-50"
                >
                  {isSimulatingImpact ? <Loader2 className="animate-spin" size={20} /> : <ArrowUpRight size={20} />}
                </button>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => (document.getElementById('sipa-input') as HTMLTextAreaElement).value = "Plantão de dúvidas focado em descritores de probabilidade e estatística."}
                  className="text-[10px] font-black text-indigo-300/60 hover:text-indigo-300 uppercase underline transition-colors"
                >
                  Sugestão 1
                </button>
                <button 
                  onClick={() => (document.getElementById('sipa-input') as HTMLTextAreaElement).value = "Gamificação da unidade de grandezas e medidas com badges por competência."}
                  className="text-[10px] font-black text-indigo-300/60 hover:text-indigo-300 uppercase underline transition-colors"
                >
                  Sugestão 2
                </button>
              </div>
            </div>

            <div className="relative min-h-[200px] flex items-center justify-center">
              {!sipaResult && !isSimulatingImpact && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 opacity-40">
                    <TrendingUp size={32} className="text-white" />
                  </div>
                  <p className="text-indigo-300/40 text-xs font-bold uppercase tracking-widest italic">Aguardando definição de intervenção</p>
                </div>
              )}

              {isSimulatingImpact && (
                <div className="text-center space-y-6">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-indigo-400 rounded-full animate-spin" />
                  </div>
                  <p className="text-indigo-200 animate-pulse text-sm font-bold uppercase tracking-widest">Processando Cenários...</p>
                </div>
              )}

              {sipaResult && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 p-5 rounded-3xl text-center">
                      <p className="text-[10px] font-black text-indigo-300/50 uppercase tracking-widest mb-1">Crescimento Projetado</p>
                      <p className="text-3xl font-black text-emerald-400">+{sipaResult.projectedGrowth}%</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-5 rounded-3xl text-center">
                      <p className="text-[10px] font-black text-indigo-300/50 uppercase tracking-widest mb-1">Tempo Estimado</p>
                      <p className="text-3xl font-black text-indigo-300">{sipaResult.timeToGoal}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {sipaResult.impactByGroup.map((impact, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                        <span className="text-xs font-bold text-indigo-100">{impact.group}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-indigo-300/50 line-through">{impact.before}%</span>
                          <div className="flex items-center gap-1 text-emerald-400 text-xs font-black">
                            <ArrowUpRight size={12} />
                            {impact.after}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1 flex items-center gap-2">
                      <Brain size={12} /> Insight do Simulador
                    </p>
                    <p className="text-[11px] text-emerald-100 leading-relaxed font-medium">
                      {sipaResult.aiCommentary}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
// Note: KpiCard and ChartCard components remain same locally in file...
function KpiCard({ title, value, icon, trend, trendType, color }: { title: string, value: string | number, icon: React.ReactNode, trend: string, trendType: 'up' | 'down', color: string }) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-2xl border", colors[color])}>
          {icon}
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
          trendType === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        )}>
          {trendType === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
      <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-3xl font-black text-gray-900">{value}</h3>
    </div>
  );
}

function ChartCard({ title, subtitle, children, className }: { title: string, subtitle?: string, children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("bg-white p-8 rounded-3xl shadow-xl border border-gray-100", className)}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
