import React, { useState, useEffect, useMemo } from 'react';
import { XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  collection, query, getDocs, limit 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  Target, 
  TrendingUp, 
  Brain, 
  Users, 
  AlertTriangle, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { calculateProbability, TRIParameters } from '../../services/triService';
import { cn } from '../../lib/utils';

interface ItemMetrics {
  id: string;
  enunciado: string;
  competencia: string;
  a: number; // Discriminação
  b: number; // Dificuldade
  c: number; // Acaso
  correctRate: number;
  totalResponses: number;
}

export const TRIDashboardView: React.FC = () => {
  const [items, setItems] = useState<ItemMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ItemMetrics | null>(null);

  useEffect(() => {
    // Simulating fetching stats from submissions
    // In a real app, we would process 'exam_submissions' to calculate real TRI
    const fetchStats = async () => {
      const q = query(collection(db, 'questions'), limit(50));
      const snapshot = await getDocs(q);
      
      const simulatedItems = snapshot.docs.map(doc => {
        const data = doc.data();
        // Simulating TRI parameters based on difficulty field
        const difficultyMap: Record<string, number> = { 'fácil': -1.5, 'médio': 0, 'difícil': 1.5 };
        const b = difficultyMap[data.dificuldade] || 0;
        
        return {
          id: doc.id,
          enunciado: data.enunciado,
          competencia: data.competenciaNome || data.competenciaId || 'Geral',
          a: 0.8 + Math.random() * 1.2, // Random discrimination for demo
          b: b + (Math.random() - 0.5),
          c: 0.2 + (Math.random() * 0.05),
          correctRate: 0.3 + Math.random() * 0.6,
          totalResponses: Math.floor(Math.random() * 100) + 10
        };
      });

      setItems(simulatedItems);
      setLoading(false);
      if (simulatedItems.length > 0) setSelectedItem(simulatedItems[0]);
    };

    fetchStats();
  }, []);

  const curveData = useMemo(() => {
    if (!selectedItem) return [];
    const data = [];
    const params: TRIParameters = { a: selectedItem.a, b: selectedItem.b, c: selectedItem.c };
    
    for (let theta = -3; theta <= 3; theta += 0.2) {
      data.push({
        theta: theta.toFixed(1),
        prob: calculateProbability(theta, params)
      });
    }
    return data;
  }, [selectedItem]);

  if (loading) return <div className="p-20 text-center">Carregando análise pedagógica...</div>;

  return (
    <div className="p-6 space-y-8 bg-white dark:bg-gray-950 min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="text-indigo-600" />
            Análise por Teoria de Resposta ao Item (TRI)
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Avaliação psicométrica da qualidade dos itens e proficiência dos estudantes.</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl text-xs font-bold border border-indigo-100 dark:border-indigo-800">
             Calibração em Tempo Real
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Item List */}
        <div className="lg:col-span-1 bg-gray-50 dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 h-[800px] overflow-y-auto">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 px-2">Banco de Itens para Análise</h3>
          <div className="space-y-3">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl transition-all border",
                  selectedItem?.id === item.id 
                    ? "bg-white dark:bg-gray-800 border-indigo-500 shadow-md ring-2 ring-indigo-500/10" 
                    : "bg-transparent border-transparent hover:bg-gray-200/50 dark:hover:bg-gray-800/50"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-md">
                    {item.competencia}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Users size={12} /> {item.totalResponses}
                  </div>
                </div>
                <p className="text-sm font-medium line-clamp-2 text-gray-700 dark:text-gray-300 mb-2">
                  {item.enunciado}
                </p>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="text-indigo-600">a: {item.a.toFixed(2)}</span>
                  <span className="text-amber-600">b: {item.b.toFixed(2)}</span>
                  <span className="text-emerald-600">c: {item.c.toFixed(2)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ICC Chart and Detailed Analysis */}
        <div className="lg:col-span-2 space-y-8">
          {selectedItem && (
            <>
              {/* ICC Chart */}
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="text-indigo-600" />
                    Curva Característica do Item (CCI)
                  </h3>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-gray-400">Ponto de Inflexão (b)</span>
                      <span className="text-lg font-bold">{selectedItem.b.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-gray-400">Poder Discriminatório (a)</span>
                      <span className="text-lg font-bold">{selectedItem.a.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="h-[400px] min-h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={curveData}>
                      <defs>
                        <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                      <XAxis 
                        dataKey="theta" 
                        label={{ value: 'Proficiência (θ)', position: 'insideBottom', offset: -5 }} 
                        stroke="#9CA3AF"
                      />
                      <YAxis 
                        domain={[0, 1]} 
                        label={{ value: 'Prob. Acerto', angle: -90, position: 'insideLeft' }}
                        stroke="#9CA3AF"
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, 'Probabilidade']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="prob" 
                        stroke="#6366f1" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorProb)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] text-gray-400 text-center mt-4 italic">
                  Eixo X: Representa a proficiência do aluno. Eixo Y: Probabilidade de acerto.
                </p>
              </div>

              {/* Insights Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800">
                  <h4 className="flex items-center gap-2 font-bold mb-4">
                    <Brain className="text-indigo-600" />
                    Diagnóstico Psicofísico
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Qualidade de Discriminação:</span>
                      <span className={cn(
                        "font-bold",
                        selectedItem.a > 1.2 ? "text-green-600" : selectedItem.a > 0.8 ? "text-amber-600" : "text-red-600"
                      )}>
                        {selectedItem.a > 1.2 ? 'Excelente' : selectedItem.a > 0.8 ? 'Bom' : 'Necessita Revisão'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Calibração de Dificuldade:</span>
                      <span className="font-bold text-indigo-700 dark:text-indigo-300">
                        {selectedItem.b < -1 ? 'Iniciante' : selectedItem.b < 1 ? 'Intermediário' : 'Avançado'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Taxa de Acerto Real:</span>
                      <span className="font-bold">{(selectedItem.correctRate * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800">
                  <h4 className="flex items-center gap-2 font-bold mb-4 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={20} />
                    Recomendações de Ajuste
                  </h4>
                  <ul className="space-y-3">
                    {selectedItem.a < 0.9 && (
                      <li className="text-xs flex gap-2">
                        <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                        Aumentar a clareza do enunciado para melhorar a diferenciação entre alunos.
                      </li>
                    )}
                    {selectedItem.correctRate > 0.8 && (
                      <li className="text-xs flex gap-2">
                        <ArrowRight size={14} className="text-emerald-600 shrink-0" />
                        Considerar aumentar a dificuldade dos distratores (alternativas incorretas).
                      </li>
                    )}
                    <li className="text-xs flex gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      Manter este item em simulados de nível {selectedItem.b < 0 ? 'Básico' : 'Médio/Avançado'}.
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
