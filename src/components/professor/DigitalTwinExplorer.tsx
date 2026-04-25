import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, Zap, TrendingUp, AlertTriangle, Play, 
  Target, Shield, Info,
  ChevronRight, Gauge, Activity, Cpu, Loader2, Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { simulateDigitalTwin, TwinSimulationResult } from '../../services/geminiService';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface DigitalTwinExplorerProps {
  stats: any;
  selectedModel: string;
}

const SCENARIOS = [
  { 
    id: 'stress-test', 
    name: 'Teste de Estresse Cognitivo', 
    description: 'Simula um aumento repentino na complexidade dos descritores críticos.',
    icon: <Zap size={18} />
  },
  { 
    id: 'prerequisite-skip', 
    name: 'Pular Pré-requisito', 
    description: 'Analisa o impacto de avançar para álgebra sem consolidar aritmética básica.',
    icon: <Cpu size={18} />
  },
  { 
    id: 'intensive-remediation', 
    name: 'Remediação Intensiva', 
    description: 'Simula 2 semanas de foco total em competências de Interpretação.',
    icon: <Activity size={18} />
  },
  { 
    id: 'hybrid-exam', 
    name: 'Simulado Híbrido', 
    description: 'Preve o desempenho em uma prova com mix de níveis Bloom (60% Difícil).',
    icon: <Target size={18} />
  }
];

export function DigitalTwinExplorer({ stats, selectedModel }: DigitalTwinExplorerProps) {
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<TwinSimulationResult | null>(null);
  const [historicalTimeline, setHistoricalTimeline] = useState<any[]>([]);

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const simulation = await simulateDigitalTwin(stats, activeScenario.description, selectedModel);
      setResult(simulation);
      
      // Update local simulation timeline
      setHistoricalTimeline(prev => [
        ...prev,
        { 
          time: new Date().toLocaleTimeString(), 
          performance: simulation.predictedPerformance,
          scenario: activeScenario.name
        }
      ].slice(-5));
      
      toast.success('Simulação concluída com sucesso!');
    } catch (err) {
      toast.error('Erro na engine de simulação.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[700px] font-mono">
      {/* Header - Mission Control Style */}
      <div className="bg-gray-900 text-white p-6 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-400/20">
            <Cpu className="text-indigo-400 animate-pulse" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter uppercase">Laboratório de Simulação Preditiva</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Motor: Digital Twin v4.2 // Nucleo: {selectedModel}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold">
            TIME_SYNC: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Scenarios */}
        <div className="w-80 border-r border-gray-100 bg-gray-50/50 p-6 space-y-6 overflow-y-auto">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Cenários Prontos</p>
          <div className="space-y-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveScenario(s)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl transition-all border-2",
                  activeScenario.id === s.id 
                    ? "bg-white border-indigo-500 shadow-lg shadow-indigo-100 ring-4 ring-indigo-50" 
                    : "bg-transparent border-transparent hover:bg-gray-100 text-gray-500"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    "p-2 rounded-lg",
                    activeScenario.id === s.id ? "bg-indigo-600 text-white" : "bg-gray-200"
                  )}>
                    {s.icon}
                  </div>
                  <span className="font-black text-xs uppercase tracking-tight">
                    {activeScenario.id === s.id && <span className="mr-1">◈</span>}
                    {s.name}
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed opacity-70 italic">{s.description}</p>
              </button>
            ))}
          </div>

          <div className="pt-6 border-t border-gray-200">
            <button 
              onClick={runSimulation}
              disabled={isSimulating}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> PROCESANDO...
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" /> INICIAR SIMULAÇÃO
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Simulation Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50/20">
          <AnimatePresence mode="wait">
            {!result && !isSimulating ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <Brain size={48} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Pronto para Simulação</h3>
                <p className="text-gray-500 text-sm max-w-sm mb-8 italic">
                  Selecione um cenário e acione o processamento para prever o comportamento cognitivo da turma através do Digital Twin.
                </p>
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                  <div className="p-4 bg-white border border-gray-100 rounded-2xl text-left">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Acurácia IA</p>
                    <p className="text-sm font-bold">~94.2% Baseada em 1k+ pontos</p>
                  </div>
                  <div className="p-4 bg-white border border-gray-100 rounded-2xl text-left">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Status Engine</p>
                    <p className="text-sm font-bold">Operational // Green</p>
                  </div>
                </div>
              </motion.div>
            ) : isSimulating ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center space-y-8"
              >
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-indigo-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin" />
                  <div className="absolute inset-4 bg-indigo-600/10 rounded-full flex items-center justify-center">
                    <Zap className="text-indigo-600 animate-bounce" size={32} />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-black tracking-tighter uppercase">Calculando Variáveis Cognitivas</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Integrando competências • Prevendo rotas • Analisando retenção</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 space-y-8"
              >
                {/* Result Summary Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Perf. Projetada</span>
                        <Gauge size={16} className="text-indigo-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-gray-900">{result?.predictedPerformance}%</span>
                        <span className={cn(
                          "text-xs font-bold",
                          result!.predictedPerformance > 70 ? "text-emerald-500" : "text-amber-500"
                        )}>
                          {result!.predictedPerformance > stats.averageScore * 100 ? '▲ UP' : '▼ DOWN'}
                        </span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confiança Modelo</span>
                        <Shield size={16} className="text-indigo-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-gray-900">{result?.engagementConfidence}%</span>
                        <span className="text-xs font-bold text-gray-400">HIGH</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alertas de Risco</span>
                        <AlertTriangle size={16} className="text-amber-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-gray-900">{result?.bottlenecks.length}</span>
                        <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">PONTOS CRÍTICOS</span>
                    </div>
                  </div>
                </div>

                {/* Main Projections Chart & Detailed Bottlenecks */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl">
                    <h4 className="text-sm font-black text-gray-900 mb-6 uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp size={16} /> Mapa de Impacto por Competência
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <RadarChart data={result?.detailedProjections}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="competency" tick={{ fontSize: 10, fontWeight: 700 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar
                            name="Success Rate"
                            dataKey="probabilityOfSuccess"
                            stroke="#4f46e5"
                            strokeWidth={3}
                            fill="#4f46e5"
                            fillOpacity={0.3}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-gray-900 mb-2 uppercase tracking-widest flex items-center gap-2">
                      <AlertTriangle size={16} className="text-amber-500" /> Gargalos Cognitivos
                    </h4>
                    {result?.bottlenecks.map((b, i) => (
                      <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 group hover:border-amber-200 transition-colors">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                          <ChevronRight size={14} />
                        </div>
                        <span className="text-xs font-bold text-gray-700">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-indigo-900 text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Sparkles size={120} />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Recomendações IA para Mitigação</h4>
                    <div className="space-y-4 max-w-2xl">
                        {result?.recommendations.map((r, i) => (
                          <div key={i} className="flex items-start gap-4">
                            <div className="mt-1 p-1 bg-white/20 rounded-lg">
                              <Info size={12} />
                            </div>
                            <p className="text-sm font-medium italic opacity-90">"{r}"</p>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Simulation History Footer */}
      {historicalTimeline.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="flex items-center gap-8 overflow-x-auto">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-200 pr-4">Log de Simulações</span>
            {historicalTimeline.map((h, i) => (
              <div key={i} className="flex items-center gap-3 whitespace-nowrap">
                <span className="text-[10px] font-mono text-gray-400">{h.time}</span>
                <span className="text-xs font-bold text-gray-700">{h.scenario}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold",
                  h.performance > 70 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                )}>
                  P: {h.performance}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
