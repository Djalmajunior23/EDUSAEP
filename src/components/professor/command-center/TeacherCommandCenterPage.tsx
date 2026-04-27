import React, { useState, useEffect } from 'react';
import { MonitorPlay, ChevronDown } from 'lucide-react';
import { UserProfile } from '../../../types';
import { TeacherDashboardService, ClassHealthMetric, CriticalCompetency, TeacherRecommendation, NextActionInfo, WeeklySummary } from '../../../services/teacherDashboardService';

// Importing the child widgets
import { 
  ClassHealthCard, 
  CriticalCompetenciesPanel, 
  TeacherRecommendationsPanel, 
  NextActionsPanel, 
  WeeklySummaryPanel, 
  TeacherCopilotWidget 
} from './CommandCenterPanels';
import { RiskStudentsPanel } from '../../analytics/RiskStudentsPanel'; // Emprestando o painel de risco da sessão de testes
import { PedagogicalEngineSimulator } from './PedagogicalEngineSimulator';

interface TeacherCommandCenterPageProps {
  userProfile: UserProfile | null;
}

export function TeacherCommandCenterPage({ userProfile }: TeacherCommandCenterPageProps) {
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>('class_1'); // Simulating a selected class
  
  // States for each section
  const [health, setHealth] = useState<ClassHealthMetric | null>(null);
  const [competencies, setCompetencies] = useState<CriticalCompetency[]>([]);
  const [recommendations, setRecommendations] = useState<TeacherRecommendation[]>([]);
  const [nextAction, setNextAction] = useState<NextActionInfo | null>(null);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);

  const fetchCommandCenterData = async () => {
    if (!userProfile) return;
    setLoading(true);
    const tid = userProfile.uid;
    const cid = selectedClassId;
    
    try {
      const results = await Promise.allSettled([
        TeacherDashboardService.getClassOverview(cid),
        TeacherDashboardService.getCriticalCompetencies(cid),
        TeacherDashboardService.getTeacherRecommendations(tid, cid),
        TeacherDashboardService.getNextActions(tid, cid),
        TeacherDashboardService.getWeeklyPlan(tid, cid)
      ]);

      if (results[0].status === 'fulfilled') setHealth(results[0].value);
      if (results[1].status === 'fulfilled') setCompetencies(results[1].value);
      if (results[2].status === 'fulfilled') setRecommendations(results[2].value);
      if (results[3].status === 'fulfilled') setNextAction(results[3].value);
      if (results[4].status === 'fulfilled') setSummary(results[4].value);

      // Fallback for nulls if the service fails
      if (results[0].status === 'rejected') setHealth({ status: 'ATTENTION', averageScore: 68, deliveryRate: 75, attendanceRate: 88, studentsAtRisk: 4 });
    } catch (err) {
      console.error("Error loading command center data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommandCenterData();
  }, [userProfile, selectedClassId]);

  if (loading || !health) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 relative">
      <TeacherCopilotWidget />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <MonitorPlay className="text-indigo-600" size={32} />
            Sala de Comando
            <span className="text-[10px] px-2 py-1 bg-red-100 text-red-600 rounded-full uppercase tracking-widest font-bold translate-y-[-8px]">AO VIVO</span>
          </h1>
          <p className="text-gray-500 font-medium">Controle pedagógico em tempo real via IA EduAI Core.</p>
        </div>
        
        {/* Class Selector Mock */}
        <div className="relative">
          <select 
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl w-full md:w-64 font-bold text-gray-700 outline-none appearance-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
          >
            <option value="class_1">Turma 3º Ano - TDS</option>
            <option value="class_2">Turma 1º Ano - Mecatrônica</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
        </div>
      </div>

      {/* Simulator Tools */}
      <div className="mb-6">
        <PedagogicalEngineSimulator onRefresh={fetchCommandCenterData} />
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Overview & Action Plan (Col-span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <ClassHealthCard health={health} />
          {nextAction && <NextActionsPanel nextAction={nextAction} />}
          {summary && <WeeklySummaryPanel summary={summary} />}
        </div>
        
        {/* CENTER COLUMN: Students & Competencies (Col-span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
             {/* We embed the existing RiskStudentsPanel here as it fits perfectly */}
             <div className="p-4 bg-gray-50 border-b border-gray-100">
               <h3 className="font-bold text-gray-900">Alunos Pivotais (Atenção Integrada)</h3>
               <p className="text-xs text-gray-500">Monitorados pelo Motor de Risco</p>
             </div>
             <div className="p-4 overflow-y-auto">
               <RiskStudentsPanel />
             </div>
          </div>

          <div className="flex-1">
            <CriticalCompetenciesPanel competencies={competencies} />
          </div>
        </div>
        
        {/* RIGHT COLUMN: AI Recommendations & Priorities (Col-span 3) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <TeacherRecommendationsPanel recommendations={recommendations} />
          
          <div className="bg-gradient-to-t from-indigo-50 to-white p-6 rounded-3xl border border-indigo-100 shadow-sm text-center">
             <div className="w-16 h-16 bg-white shadow-lg shadow-indigo-200/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-50">
               <MonitorPlay size={32} className="text-indigo-600" />
             </div>
             <h4 className="font-bold text-gray-900 mb-1">Decisões Automatizadas</h4>
             <p className="text-xs text-gray-500 mb-4">O Motor Pedagógico está processando novas recomendações a cada nova nota inserida.</p>
             <button className="text-xs font-black text-indigo-600 uppercase tracking-wider hover:underline">Ver Histórico Completo &rarr;</button>
          </div>
        </div>

      </div>
    </div>
  );
}
