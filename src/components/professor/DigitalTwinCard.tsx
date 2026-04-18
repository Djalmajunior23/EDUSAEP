import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Brain, TrendingUp, Target, Zap, AlertTriangle, Loader2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { predictPerformance } from '../../services/geminiService';
import { toast } from 'sonner';

interface DigitalTwinCardProps {
  studentData: any;
  selectedModel: string;
}

export function DigitalTwinCard({ studentData, selectedModel }: DigitalTwinCardProps) {
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runPrediction = async () => {
    setLoading(true);
    try {
      const result = await predictPerformance(studentData, selectedModel, 'professor');
      setPrediction(result);
      toast.success('Simulação de Gêmeo Digital concluída!');
    } catch (err) {
      toast.error('Erro ao simular desempenho.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentData) {
      runPrediction();
    }
  }, [studentData]);

  const mockChartData = [
    { name: 'Histórico', value: 65 },
    { name: 'Tendência', value: prediction?.probabilityOfSuccess || 75 },
    { name: 'Meta', value: 85 },
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-3xl p-8 text-white shadow-2xl border border-indigo-500/30 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Brain size={120} />
      </div>

      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-400/30">
              <Brain className="text-indigo-300" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight">Gêmeo Digital Pedagógico</h3>
              <p className="text-indigo-200/70 text-sm">Simulação de probabilidade de sucesso (Próximo SAEP)</p>
            </div>
          </div>
          <button 
            onClick={runPrediction}
            disabled={loading}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <TrendingUp size={20} />}
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
            <p className="text-indigo-200 animate-pulse">Processando milhares de variáveis cognitivas...</p>
          </div>
        ) : prediction ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-end gap-4">
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-emerald-300">
                  {prediction.probabilityOfSuccess}%
                </div>
                <div className="mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                    prediction.riskLevel === 'Baixo' ? 'bg-emerald-500/20 text-emerald-300' :
                    prediction.riskLevel === 'Médio' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    Risco {prediction.riskLevel}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-bold text-indigo-200 uppercase tracking-widest">Fatores Determinantes:</p>
                <div className="grid grid-cols-1 gap-2">
                  {prediction.factors.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-indigo-100/80">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Zap size={14} /> Recomendação Estratégica
                </p>
                <p className="text-sm italic text-indigo-100 leading-relaxed">
                  "{prediction.recommendations}"
                </p>
              </div>
            </div>

            <div className="h-64 bg-black/20 rounded-2xl border border-white/5 p-4 flex flex-col justify-end">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1b4b', border: 'none', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#a5b4fc" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex justify-between mt-2 text-[10px] font-bold text-indigo-300/50 uppercase tracking-widest">
                <span>Passado</span>
                <span>Projeção IA</span>
                <span>Objetivo</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-indigo-300/50 italic border-2 border-dashed border-white/10 rounded-2xl">
            Aguardando carregamento de dados históricos...
          </div>
        )}
      </div>
    </div>
  );
}
