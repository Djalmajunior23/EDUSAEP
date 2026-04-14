import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Brain,
  Target,
  Users,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export function PainelInsightsIA() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, 'insights_ia'),
      orderBy('data_geracao', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInsights(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="text-center p-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
        <Brain className="mx-auto text-gray-300 mb-4" size={48} />
        <p className="text-gray-500">Nenhum insight gerado ainda. Importe dados do SIAC para começar.</p>
      </div>
    );
  }

  const currentInsight = insights[activeIndex];
  const analysis = currentInsight.json_resposta;

  return (
    <div className="space-y-6">
      {/* Tabs for multiple insights */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {insights.map((insight, idx) => (
          <button
            key={insight.id}
            onClick={() => setActiveIndex(idx)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
              activeIndex === idx 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
            )}
          >
            {new Date(insight.data_geracao?.seconds * 1000).toLocaleDateString()} - {insight.tipo === 'analise_siac' ? 'SIAC' : 'Geral'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentInsight.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="text-indigo-200" size={20} />
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">Resumo Pedagógico</span>
                </div>
                <h3 className="text-2xl font-bold mb-4 leading-tight">
                  {analysis.resumo_geral}
                </h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                    <Users size={16} />
                    <span className="text-xs font-bold">{analysis.alunos_em_risco?.length || 0} Alunos em Risco</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                    <Target size={16} />
                    <span className="text-xs font-bold">{analysis.pontos_fortes?.length || 0} Pontos Fortes</span>
                  </div>
                </div>
              </div>
              <Brain className="absolute -right-12 -bottom-12 text-white/10 w-64 h-64" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                <div className="flex items-center gap-2 mb-4 text-emerald-700">
                  <CheckCircle2 size={20} />
                  <h4 className="font-bold">Pontos Fortes</h4>
                </div>
                <ul className="space-y-3">
                  {analysis.pontos_fortes?.map((point: string, i: number) => (
                    <li key={i} className="flex gap-3 text-sm text-emerald-800">
                      <span className="font-bold opacity-50">{i + 1}.</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                <div className="flex items-center gap-2 mb-4 text-red-700">
                  <AlertTriangle size={20} />
                  <h4 className="font-bold">Dificuldades Críticas</h4>
                </div>
                <ul className="space-y-3">
                  {analysis.principais_dificuldades?.map((point: string, i: number) => (
                    <li key={i} className="flex gap-3 text-sm text-red-800">
                      <span className="font-bold opacity-50">{i + 1}.</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Action Plan & Risks */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
              <div className="flex items-center gap-2 mb-6 text-indigo-600">
                <TrendingUp size={20} />
                <h4 className="font-bold">Plano de Ação Sugerido</h4>
              </div>
              <div className="space-y-4">
                {analysis.plano_de_acao?.map((action: string, i: number) => (
                  <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-indigo-200 transition-all">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xs shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      {i + 1}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{action}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
              <div className="flex items-center gap-2 mb-4 text-indigo-700">
                <MessageSquare size={20} />
                <h4 className="font-bold">Sugestões ao Professor</h4>
              </div>
              <div className="space-y-3">
                {analysis.sugestoes_para_professor?.map((sug: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 text-xs text-indigo-800">
                    <ArrowRight size={14} className="mt-0.5 shrink-0" />
                    {sug}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
