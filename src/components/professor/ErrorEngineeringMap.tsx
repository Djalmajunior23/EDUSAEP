import React from 'react';
import { 
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, 
  ZAxis, Tooltip as RechartsTooltip, CartesianGrid 
} from 'recharts';
import { AlertCircle, Target, TrendingUp, Zap, Info, Map, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ErrorEngineeringMapProps {
  studentsData?: any; // To be fed real stats
}

// Mock Data structure modeling "Error Types" over "Competencies"
const MOCK_ERROR_CLUSTERS = [
  { id: 1, type: "Desatenção / Pressa", competency: "Interpretação Textual", frequency: 45, severity: "low", impact: 10, fill: "#3b82f6" },
  { id: 2, type: "Falta de Base (Lacuna)", competency: "Cálculo Algébrico", frequency: 82, severity: "high", impact: 85, fill: "#ef4444" },
  { id: 3, type: "Falso Aprendizado", competency: "Física - Mecânica", frequency: 60, severity: "high", impact: 70, fill: "#f97316" },
  { id: 4, type: "Erro Conceitual", competency: "Biologia Celular", frequency: 25, severity: "medium", impact: 40, fill: "#eab308" },
  { id: 5, type: "Memorização Frágil", competency: "História Medieval", frequency: 55, severity: "medium", impact: 30, fill: "#8b5cf6" },
  { id: 6, type: "Ansiedade na Prova", competency: "Múltiplas", frequency: 30, severity: "medium", impact: 50, fill: "#14b8a6" },
];

const ROOT_CAUSES = [
  { cause: "Sobrecarga Cognitiva", students: 12, trend: "up", match: "Falso Aprendizado" },
  { cause: "Pulo de Pré-requisitos", students: 28, trend: "up", match: "Falta de Base" },
  { cause: "Fadiga Visual", students: 8, trend: "down", match: "Desatenção" }
];

export function ErrorEngineeringMap({ studentsData }: ErrorEngineeringMapProps) {
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-slate-200 shadow-xl rounded-xl max-w-[280px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.fill }} />
            <h4 className="font-bold text-slate-800">{data.type}</h4>
          </div>
          <p className="text-sm font-medium text-slate-600 mb-3">{data.competency}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Recorrência:</span>
              <span className="font-bold text-slate-900">{data.frequency} casos</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Gravidade:</span>
              <span className={cn(
                "font-bold uppercase text-[10px] px-1.5 py-0.5 rounded",
                data.severity === 'high' ? 'bg-red-100 text-red-700' : 
                data.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 
                'bg-blue-100 text-blue-700'
              )}>
                {data.severity}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
             <p className="text-xs text-slate-500 italic">Intervenção sugerida na fila do Motor.</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Map className="text-indigo-600" />
            Engenharia de Erros
          </h2>
          <p className="text-slate-500 font-medium">Motor de Mapeamento, Classificação e Previsão de Lacunas.</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              Validar Auto-Recuperação
           </button>
           <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" />
              Gerar Trilha de Intervenção
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Principal do Mapa de Erros */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Target size={18} className="text-rose-500" />
                Matriz de Risco vs. Recorrência (Impacto)
              </h3>
              <div title="Clusterização de erros baseada no histórico de avaliações. Eixo X reflete o impacto na nota, Eixo Y a recorrência." className="cursor-help">
                <Info size={16} className="text-slate-400" />
              </div>
           </div>
           
           <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  type="number" 
                  dataKey="impact" 
                  name="Impacto na Nota" 
                  unit="%" 
                  stroke="#94a3b8" 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <YAxis 
                  type="number" 
                  dataKey="frequency" 
                  name="Recorrência" 
                  unit=" casos" 
                  stroke="#94a3b8" 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <ZAxis type="number" dataKey="frequency" range={[100, 1500]} name="Volume" />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                
                <Scatter name="Erros" data={MOCK_ERROR_CLUSTERS} fill="#8884d8">
                  {/* Fill comes from the data itself dynamically in the customized tooltip, but recharts needs a base for the legend */}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
           </div>
        </div>

        {/* Causa Raiz e Análise Cognitiva */}
        <div className="space-y-6">
           <div className="bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-800 text-white relative overflow-hidden">
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
             <h3 className="text-lg font-bold text-white mb-1 relative z-10">IA: Causa Raiz Principal</h3>
             <p className="text-slate-400 text-sm mb-6 relative z-10">Diagnóstico transversal do Copiloto.</p>

             <div className="space-y-4 relative z-10">
                {ROOT_CAUSES.map((cause, idx) => (
                  <div key={idx} className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                     <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm text-slate-200">{cause.cause}</span>
                        {cause.trend === 'up' ? (
                          <div className="flex items-center text-rose-400 text-xs font-bold gap-1">
                            <TrendingUp size={12} /> Crescendo
                          </div>
                        ) : (
                          <div className="flex items-center text-emerald-400 text-xs font-bold gap-1">
                            <TrendingUp size={12} className="rotate-180" /> Controlado
                          </div>
                        )}
                     </div>
                     <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Afeta {cause.students} alunos</span>
                        <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">{cause.match}</span>
                     </div>
                  </div>
                ))}
             </div>
           </div>

           <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 shadow-sm">
             <div className="flex gap-3 mb-3">
               <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 h-fit">
                 <AlertCircle size={20} />
               </div>
               <div>
                 <h4 className="font-bold text-indigo-900 text-sm">Alerta de Falso Aprendizado</h4>
                 <p className="text-xs text-indigo-700/80 mt-1">
                   A IA detectou que 60 alunos estão acertando questões de Física por eliminação rasa, e não por domínio do cálculo vetorial. Recomendado aplicar <strong>SIPA</strong>.
                 </p>
               </div>
             </div>
             <button className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1">
                Ativar Protocolo <ChevronRight size={14} />
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
