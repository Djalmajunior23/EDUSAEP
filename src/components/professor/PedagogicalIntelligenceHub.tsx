import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { GeneratedAssetsView } from './GeneratedAssetsView';
import { 
  BrainCircuit, 
  Activity, 
  Target, 
  AlertTriangle, 
  Zap, 
  TrendingUp, 
  Users, 
  Eye, 
  BookOpen, 
  Loader2,
  RefreshCw,
  Gauge,
  Layers
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { IntelligenceEngine } from '../../services/advancedIntelligenceEngine';
import { ErrorMapEntry } from '../../types';

export function PedagogicalIntelligenceHub() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMap, setErrorMap] = useState<ErrorMapEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAssetsView, setShowAssetsView] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const map = await IntelligenceEngine.generateClassErrorMap('all');
      setErrorMap(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      loadData().then(() => setRefreshing(false));
    }, 1000);
  };

  if (loading && !refreshing) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      <p className="text-gray-500 font-medium">Iniciando Motor de Inteligência Avançada...</p>
    </div>
  );

  const radarData = errorMap.map(entry => {
    const defaultSubject = typeof entry.skillId === 'string' ? entry.skillId : 'Unknown';
    return {
      subject: typeof entry.skillId === 'string' && entry.skillId.includes('-') ? entry.skillId.split('-')[1] || defaultSubject : defaultSubject,
      A: entry.errorFrequency || 0,
      fullMark: 100,
    };
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-gray-900 to-indigo-900 p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">
            <SparkleIcon /> EDUSAEP OS 2.0
          </div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <BrainCircuit className="text-indigo-400" size={36} /> Central de Inteligência
          </h1>
          <p className="text-indigo-200">20 Módulos de análise profunda, raciocínio e predição educacional.</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition-colors"
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* MODULE 8: Mapa de Erros Coletivo */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><AlertTriangle size={24} /></div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Módulo 8: Mapa de Erros Críticos</h3>
                <p className="text-sm text-gray-500">Falhas coletivas e raiz cognitiva identificada.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
              {/* Radar Chart for Errors */}
              <div className="h-64 md:h-auto min-h-[250px] bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-center p-4">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Frequência de Erro %" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Error List */}
              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {errorMap.map((error, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-gray-100 bg-white hover:border-red-200 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{error.skillId}</span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${error.errorFrequency > 60 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {error.errorFrequency}% de Erro
                      </span>
                    </div>
                    <p className="font-bold text-gray-900 text-sm mb-3">
                      Raiz: <span className="capitalize">{error.cognitiveRootCause}</span>
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ação Recomendada (IA):</p>
                      {error.suggestedInterventions.map((action, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <Zap size={14} className="text-amber-500 mt-0.5 shrink-0" />
                          <span className="font-medium">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Other Modules Highlights */}
        <div className="space-y-6">
          <button 
            onClick={() => setShowAssetsView(true)}
            className="w-full text-left bg-emerald-50 p-6 rounded-3xl border border-emerald-100 hover:border-emerald-300 transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl"><Layers size={20} /></div>
              <h3 className="font-bold text-emerald-950">Recursos de IA (Bank)</h3>
            </div>
            <p className="text-sm text-emerald-900/70">Gerencie todos os assets técnicos (código, imagens, diagramas) gerados.</p>
          </button>
          
          {/* MODULE 16: Detecção de Falso Aprendizado */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-600 justify-center flex items-center text-white rounded-xl"><Eye size={20} /></div>
              <h3 className="font-bold text-indigo-950">Falso Aprendizado (Mód. 16)</h3>
            </div>
            <p className="text-sm text-indigo-900/70 mb-4">
              A IA cruza dados de TRI e tempo de tela para encontrar acertos ao acaso ("chutes").
            </p>
            <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Acertos de Sorte Detectados</span>
                <span className="text-red-600 font-black text-sm bg-red-50 px-2 py-0.5 rounded-lg">Alta Suspeita</span>
              </div>
              <p className="text-2xl font-black text-gray-900">12 Alunos</p>
              <button 
                onClick={() => navigate('/teacher-ai-assistant')}
                className="w-full mt-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                Gerar Lista de Revisão
              </button>
            </div>
          </div>

          {/* MODULE 13: Carga Cognitiva */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl"><Gauge size={20} /></div>
              <h3 className="font-bold text-gray-900">Sobrecarga (Mód. 13)</h3>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-500">Índice de Fadiga Escolar</span>
                <span className="font-black text-amber-600">68%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>
            </div>

            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
              <span className="font-bold text-gray-900">Atenção:</span> O volume de Atendimentos Extracurriculares das últimas 48h sugere risco de "Burnout" em 18% da turma.
            </p>
          </div>

        </div>
      </div>
      
     {/* Bottom Area - Feature Roadmap Visualization */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mt-8">
         <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
           <Activity className="text-emerald-500" /> Pipeline Analítico & Inovação Ativa
         </h3>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Gaps Invisíveis (Mod. 1)" value="Analisando" subtitle="Pré-requisitos" color="emerald" />
            <MetricCard title="Retenção (Mod. 19)" value="Curva Gerada" subtitle="Decaimento ATIVO" color="purple" />
            <MetricCard title="Tempo de Resposta (Mod. 14)" value="Em Tempo Real" subtitle="Dificuldade: Média" color="blue" />
            <MetricCard title="ABP Automática (Mod. 18)" value="Disponível" subtitle="Composição IA" color="indigo" />
         </div>
      </div>
      {showAssetsView && <GeneratedAssetsView onClose={() => setShowAssetsView(false)} />}
    </div>
  );
}

function MetricCard({ title, value, subtitle, color }: any) {
  const colorMap: any = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  };

  return (
    <div className={`p-4 rounded-2xl border ${colorMap[color]} flex flex-col justify-center`}>
      <p className="text-[10px] font-black uppercase tracking-wider opacity-60 mb-1">{title}</p>
      <p className="text-lg font-black">{value}</p>
      <p className="text-xs font-bold mt-2 opacity-80">{subtitle}</p>
    </div>
  )
}

function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
      <path d="M12 3v18M3 12h18M18.36 5.64l-12.72 12.72M5.64 5.64l12.72 12.72" />
    </svg>
  )
}
