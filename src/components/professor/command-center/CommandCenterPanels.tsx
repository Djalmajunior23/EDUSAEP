import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, Users, AlertTriangle, CheckCircle2,
  TrendingDown, TrendingUp, Target, Zap, Bot,
  Award, FileText, Play, BookOpen,
  Sword
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ClassHealthMetric, CriticalCompetency, TeacherRecommendation, NextActionInfo, WeeklySummary } from '../../../pedagogical-engine/services/TeacherDashboardService';

// --- WIDGET 1: Class Health Card ---
export function ClassHealthCard({ health }: { health: ClassHealthMetric }) {
  const isCritical = health.status === 'CRITICAL';
  const isAttention = health.status === 'ATTENTION';
  const colorClass = isCritical ? 'bg-red-50 text-red-700 border-red-200' : isAttention ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
  const iconColor = isCritical ? 'text-red-500' : isAttention ? 'text-amber-500' : 'text-emerald-500';

  return (
    <div className={`p-6 rounded-3xl border shadow-sm flex flex-col gap-4 ${colorClass}`}>
      <div className="flex justify-between items-start">
        <h3 className="font-bold flex items-center gap-2">
          <Activity size={20} className={iconColor} />
          Pulso da Turma
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border bg-white/50 ${colorClass}`}>
          {health.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div>
          <p className="text-xs uppercase font-bold opacity-70">Média Geral</p>
          <p className="text-3xl font-black">{health.averageScore.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs uppercase font-bold opacity-70">Envolvimento</p>
          <p className="text-3xl font-black">{health.deliveryRate.toFixed(1)}%</p>
        </div>
      </div>
      <div className="mt-2 text-sm font-medium flex items-center gap-2">
        <AlertTriangle size={16} className={health.studentsAtRisk > 0 ? 'text-red-500' : 'opacity-50'} />
        {health.studentsAtRisk} alunos em risco grave
      </div>
    </div>
  );
}

// --- WIDGET 2: Critical Competencies ---
export function CriticalCompetenciesPanel({ competencies }: { competencies: CriticalCompetency[] }) {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGenerate = (id: string, name: string) => {
    setIsGenerating(id);
    
    // Simulate generation routing to the Copilot Module
    setTimeout(() => {
      setIsGenerating(null);
      navigate(`/copilot?mode=generate-activity&competency=${encodeURIComponent(name)}`);
    }, 1500); 
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4 h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Target size={120} />
      </div>

      <div className="flex items-center justify-between border-b border-gray-50 pb-3">
        <h3 className="font-bold flex items-center gap-2 text-gray-900">
          <Target size={20} className="text-rose-500" />
          Competências Críticas
        </h3>
        <button 
          onClick={() => navigate('/mass-rescue')}
          className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1.5"
        >
          <Sword size={12} />
          Modo Resgate
        </button>
      </div>
      
      {competencies.length === 0 ? (
        <div className="text-sm text-gray-500 italic py-4 text-center">Nenhuma defasagem gritante no momento.</div>
      ) : (
        <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {competencies.map(comp => (
            <div key={comp.id} className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-rose-900 text-sm leading-tight">{comp.name}</p>
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ml-2">{comp.affectedStudents} alunos</span>
                </div>
                <p className="text-xs text-rose-700 flex items-start gap-1.5 mt-2 bg-white/50 p-2 rounded-lg mb-4">
                  <Zap size={14} className="shrink-0 mt-0.5" />
                  <span>{comp.recommendation}</span>
                </p>
              </div>

              <button 
                onClick={() => handleGenerate(comp.id, comp.name)}
                disabled={isGenerating === comp.id}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border border-dashed border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-wait"
              >
                {isGenerating === comp.id ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    Montando PDF com a IA...
                  </span>
                ) : (
                  <>
                    <Bot size={14} className="text-indigo-500" />
                    Gerar Trilha de Reforço (IA)
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- WIDGET 3: Teacher Recommendations ---
export function TeacherRecommendationsPanel({ recommendations }: { recommendations: TeacherRecommendation[] }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
      <h3 className="font-bold flex items-center gap-2 text-gray-900 border-b border-gray-50 pb-3">
        <CheckCircle2 size={20} className="text-indigo-500" />
        Decisões Pedagógicas (Copiloto)
      </h3>
      
      <div className="space-y-3">
        {recommendations.map(rec => (
          <motion.div whileHover={{ scale: 1.01 }} key={rec.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex gap-4 items-center">
            <div className={`p-3 rounded-xl shrink-0 ${
              rec.priority === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
            }`}>
              {rec.actionType === 'MEETING' ? <Users size={20} /> : <FileText size={20} />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 text-sm truncate">{rec.title}</h4>
              <p className="text-xs text-gray-500 truncate">{rec.description}</p>
              <p className="text-[10px] font-bold text-indigo-600 mt-1 uppercase tracking-widest">{rec.reason}</p>
            </div>
            <button 
              onClick={() => navigate('/copilot')}
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors shrink-0"
            >
              Agir
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// --- WIDGET 4: Next Actions & Planner ---
export function NextActionsPanel({ nextAction }: { nextAction: NextActionInfo }) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-3xl shadow-lg flex flex-col gap-4 text-white">
      <h3 className="font-bold flex items-center gap-2 border-b border-slate-700/50 pb-3">
        <Play size={20} className="text-indigo-400" />
        Próxima Aula: Estratégia
      </h3>
      
      <p className="text-sm text-indigo-200 bg-black/20 p-4 rounded-2xl border border-white/5 italic">
        "{nextAction.copilotSuggestion}"
      </p>

      <div className="space-y-3">
        <div>
          <p className="text-xs uppercase font-bold text-slate-400 mb-1">Revisão Necessária:</p>
          <div className="flex flex-wrap gap-2">
            {nextAction.competenciesToReview.map((c, i) => (
              <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                {c}
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <p className="text-xs uppercase font-bold text-slate-400 mb-1">Atividade Sugerida:</p>
          <div className="flex items-center gap-2 text-sm text-emerald-300 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
            <BookOpen size={16} />
            <span className="font-medium">{nextAction.suggestedActivity}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- WIDGET 5: Weekly Summary ---
export function WeeklySummaryPanel({ summary }: { summary: WeeklySummary }) {
  const isPositive = summary.weekProgress >= 0;

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
      <h3 className="font-bold flex items-center gap-2 text-gray-900 border-b border-gray-50 pb-3">
        <Award size={20} className="text-amber-500" />
        Progresso da Semana
      </h3>
      
      <div className="flex items-end gap-4">
        <div className={`p-4 rounded-2xl ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'} flex-1`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Evolução Líquida</span>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          </div>
          <span className="text-3xl font-black">{isPositive ? '+' : ''}{summary.weekProgress}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="p-3 bg-gray-50 rounded-xl text-center">
          <p className="text-2xl font-black text-emerald-600">{summary.improvedStudents}</p>
          <p className="text-[10px] uppercase font-bold text-gray-500">Alunos Evoluíram</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl text-center">
          <p className="text-2xl font-black text-rose-600">{summary.declinedStudents}</p>
          <p className="text-[10px] uppercase font-bold text-gray-500">Alunos Pioraram</p>
        </div>
      </div>
      
      <p className="text-xs text-gray-600 bg-blue-50 p-3 rounded-xl border border-blue-100 mt-2">
        <span className="font-bold text-blue-800">Insight: </span>
        {summary.activitiesImpact}
      </p>
    </div>
  );
}

// --- WIDGET 6: Mini Copilot Floating ---
export function TeacherCopilotWidget() {
  const navigate = useNavigate();
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate('/copilot')}
      className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-500/50 flex items-center gap-3 group z-50"
    >
      <Bot size={24} />
      <span className="w-0 overflow-hidden group-hover:w-auto group-hover:mr-2 whitespace-nowrap font-bold text-sm transition-all duration-300">
        Falar com o Copiloto
      </span>
    </motion.button>
  );
}
