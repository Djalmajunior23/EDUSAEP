import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Brain, AlertTriangle, ArrowRight, Zap, Target, Users } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export function PedagogicalDecisionsWidget() {
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState<any[]>([]);
  const [riskStats, setRiskStats] = useState({ high: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch latest pedagogical decisions
      const decisionsQuery = query(
        collection(db, 'pedagogicalDecisions'),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const decisionsSnap = await getDocs(decisionsQuery);
      setDecisions(decisionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch risks summary
      const risksSnap = await getDocs(collection(db, 'studentRiskScores'));
      const highRisk = risksSnap.docs.filter(d => d.data().level === 'HIGH' || d.data().riskLevel === 'Crítico').length;
      setRiskStats({ high: highRisk, total: risksSnap.size });

    } catch (error) {
      console.error("Error fetching pedagogical widget data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-50 dark:bg-gray-700/50 rounded-2xl"></div>
          <div className="h-20 bg-gray-50 dark:bg-gray-700/50 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Brain size={120} />
      </div>

      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Zap size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Inteligência de Decisão</h3>
          </div>
          <button 
            onClick={() => navigate('/observatory')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
          >
            Observatório <ArrowRight size={14} />
          </button>
        </div>

        {/* Resumo de Risco */}
        <div className="flex items-center gap-4 p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl">
          <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-rose-600 shadow-sm">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest">Alerta de Retenção</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {riskStats.high} alunos com risco crítico de aprendizagem detectado.
            </p>
          </div>
        </div>

        {/* Decisões Recentes */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Próximos Passos Pedagógicos (IA)</p>
          {decisions.length > 0 ? (
            decisions.map((decision) => (
              <div key={decision.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-indigo-200 transition-all">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {decision.type === 'RECOVERY' ? <Target className="text-emerald-500" size={14} /> : <Users className="text-blue-500" size={14} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      {decision.title || (decision.type === 'RECOVERY' ? 'Intervenção Necessária' : 'Sugestão de Turma')}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                      {decision.summary || decision.description}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-400 text-xs italic bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
              Nenhuma decisão pendente no momento.
            </div>
          )}
        </div>

        <button 
          onClick={() => navigate('/copilot')}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          Consultar Copiloto Pedagógico
        </button>
      </div>
    </div>
  );
}
