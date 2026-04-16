import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Telescope, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Target, 
  Activity, 
  MessageSquare, 
  ChevronRight, 
  Loader2,
  BrainCircuit,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Flame,
  Sparkles,
  Zap,
  FileText,
  X,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { getClassObservatoryData, ClassObservatoryData } from '../../services/dashboardService';
import { generateInterventionPlan } from '../../services/geminiService';
import { toast } from 'sonner';

export function ClassObservatoryView() {
  const [data, setData] = useState<ClassObservatoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [interventionPlan, setInterventionPlan] = useState<any>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const observatoryData = await getClassObservatoryData();
      setData(observatoryData);
    } catch (error) {
      toast.error("Erro ao carregar dados do observatório.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!data) return;
    setIsGeneratingPlan(true);
    try {
      const plan = await generateInterventionPlan(data);
      setInterventionPlan(plan);
      setShowPlanModal(true);
      toast.success("Plano de Intervenção gerado com sucesso!");
    } catch (error) {
      console.error("Error generating intervention plan:", error);
      toast.error("Erro ao gerar plano de intervenção.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      <p className="text-gray-500 font-medium">Sincronizando dados pedagógicos...</p>
    </div>
  );

  if (!data) return null;

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Telescope className="text-indigo-600" size={32} /> Observatório da Turma
          </h2>
          <p className="text-gray-500 mt-1">Visão macro do desempenho, engajamento e riscos pedagógicos.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Média da Turma</p>
            <p className="text-2xl font-black text-indigo-700">{data.engagementMetrics.averageGrade}%</p>
          </div>
          <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Taxa de Entrega</p>
            <p className="text-2xl font-black text-emerald-700">{data.engagementMetrics.averageSubmissionRate}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Risks & Alerts */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20} /> Alunos em Risco
              </h3>
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-black">
                {data.studentsAtRisk.length} Alertas
              </span>
            </div>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {data.studentsAtRisk.map(student => (
                <motion.div 
                  key={student.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{student.name}</h4>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      student.riskLevel === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {student.riskLevel === 'high' ? 'Crítico' : 'Atenção'}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap mb-3">
                    {student.reasons.map((reason, idx) => (
                      <span key={idx} className="text-[10px] bg-white border border-gray-100 px-2 py-0.5 rounded-md text-gray-600">
                        {reason}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded-xl border border-gray-50">
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Nota Média</p>
                      <p className={`text-sm font-black ${student.averageGrade < 60 ? 'text-red-600' : 'text-amber-600'}`}>
                        {student.averageGrade}%
                      </p>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-gray-50">
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Entregas</p>
                      <p className={`text-sm font-black ${student.submissionRate < 70 ? 'text-red-600' : 'text-gray-900'}`}>
                        {student.submissionRate}%
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {data.studentsAtRisk.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Users size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-medium">Nenhum aluno em risco identificado.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl shadow-xl text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BrainCircuit size={20} /> Insight da IA
            </h3>
            <p className="text-sm text-indigo-100 leading-relaxed italic">
              "A turma apresenta uma queda de 15% na taxa de entrega na última semana. Recomenda-se revisar a complexidade da atividade 'Banco de Dados II' ou enviar um lembrete motivacional via fórum."
            </p>
            <button 
              onClick={handleGeneratePlan}
              disabled={isGeneratingPlan}
              className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGeneratingPlan ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              Gerar Plano de Intervenção
            </button>
          </div>
        </div>

        {/* Intervention Plan Modal */}
        <AnimatePresence>
          {showPlanModal && interventionPlan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
                  <div className="flex items-center gap-3">
                    <FileText size={24} />
                    <h3 className="text-xl font-black">Plano de Intervenção Pedagógica</h3>
                  </div>
                  <button onClick={() => setShowPlanModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8">
                  {/* Diagnóstico */}
                  <section className="space-y-3">
                    <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                      <Target size={16} /> Diagnóstico da Situação
                    </h4>
                    <p className="text-gray-700 leading-relaxed bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                      {interventionPlan.diagnostico}
                    </p>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Estratégias */}
                    <section className="space-y-4">
                      <h4 className="text-sm font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 size={16} /> Estratégias de Recuperação
                      </h4>
                      <div className="space-y-2">
                        {interventionPlan.estrategias.map((est: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">
                              {i + 1}
                            </div>
                            <span className="text-sm text-emerald-900 font-medium">{est}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Atividades */}
                    <section className="space-y-4">
                      <h4 className="text-sm font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={16} /> Atividades Sugeridas
                      </h4>
                      <div className="space-y-3">
                        {interventionPlan.atividades.map((atv: any, i: number) => (
                          <div key={i} className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <p className="text-xs font-black text-amber-700 uppercase mb-1">{atv.competencia}</p>
                            <p className="text-sm text-amber-900 font-medium">{atv.sugestao}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  {/* Cronograma */}
                  <section className="space-y-4">
                    <h4 className="text-sm font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={16} /> Cronograma de Aplicação
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {interventionPlan.cronograma.map((item: any, i: number) => (
                        <div key={i} className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                          <p className="text-xs font-black text-purple-700 uppercase mb-2">Semana {item.semana}</p>
                          <p className="text-xs font-bold text-purple-900 mb-3">{item.foco}</p>
                          <ul className="space-y-1">
                            {item.acoes.map((acao: string, j: number) => (
                              <li key={j} className="text-[10px] text-purple-800 flex items-center gap-1">
                                <ChevronRight size={10} /> {acao}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button 
                    onClick={() => setShowPlanModal(false)}
                    className="px-6 py-2 text-gray-600 font-bold hover:text-gray-900 transition-colors"
                  >
                    Fechar
                  </button>
                  <button className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2">
                    <FileText size={18} /> Salvar e Aplicar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Right Column: Analytics */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Competency Heatmap */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Target className="text-indigo-600" size={20} /> Mapa de Competências
              </h3>
              <div className="space-y-4">
                {data.competencyHeatmap.map((comp, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-700">{comp.competency}</span>
                      <span className={
                        comp.status === 'critical' ? 'text-red-600' : 
                        comp.status === 'attention' ? 'text-amber-600' : 'text-emerald-600'
                      }>{comp.score}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${comp.score}%` }}
                        className={`h-full rounded-full ${
                          comp.status === 'critical' ? 'bg-red-500' : 
                          comp.status === 'attention' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement Distribution */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Flame className="text-orange-500" size={20} /> Engajamento da Turma
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Ativos', value: data.engagementMetrics.forumParticipation },
                        { name: 'Inativos', value: 100 - data.engagementMetrics.forumParticipation }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#6366f1" />
                      <Cell fill="#f3f4f6" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-gray-900">{data.engagementMetrics.forumParticipation}%</p>
                <p className="text-xs text-gray-500 font-medium">Participação em Fóruns</p>
              </div>
            </div>
          </div>

          {/* Evolution Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="text-emerald-600" size={20} /> Evolução da Média Geral
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.evolution}>
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="period" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="classAverage" 
                    stroke="#6366f1" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorAvg)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
